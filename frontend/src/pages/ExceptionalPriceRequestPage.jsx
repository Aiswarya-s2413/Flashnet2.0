import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import API from '../api'

const DEFAULT_LINE_ITEM = {
  business_proposal: 'New',
  price_request_type: 'New',
  material_code: '',
  material_name: '',
  existing_dist_price: '',
  existing_icp: '',
  existing_sale_volume: '',
  requested_dist_price: '',
  requested_icp: '',
  proposed_sale_volume: '',
  freight_charges: 'Paid By Distributor',
  distributor_payment_terms: '',
  end_customer_payment_terms: '',
  product_used_in_package: 'No',
  other_products_details: '',
  competition_running: 'No',
  competition_product_name: '',
  competition_price: '',
  competition_volume: '',
  remarks: ''
}

export default function ExceptionalPriceRequestPage() {
  const [header, setHeader] = useState({
    legacy_organization: '',
    soldto_code: '',
    soldto_name: '',
    shipto_code: '',
    shipto_name: '',
    end_customer_name: '',
    additional_remarks: ''
  })
  const [lineItems, setLineItems] = useState([{ ...DEFAULT_LINE_ITEM }])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])

  useEffect(() => {
    API.get('/products/')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Failed to load products", err))
  }, [])

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value })
  }

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    
    if (field === 'material_name') {
      const selectedProduct = products.find(p => p.material_name === value)
      if (selectedProduct) {
        updated[index]['material_code'] = selectedProduct.material_code
      } else {
        updated[index]['material_code'] = ''
      }
    }
    
    setLineItems(updated)
  }

  const addLineItem = () => setLineItems([...lineItems, { ...DEFAULT_LINE_ITEM }])

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    // Construct Payload
    const payload = {
      ...header,
      line_items: lineItems.map(item => {
        // Convert empty strings to null for numeric fields to prevent 400s
        const cleaned = { ...item }
        const numFields = ['existing_dist_price', 'existing_icp', 'existing_sale_volume',
          'requested_dist_price', 'requested_icp', 'proposed_sale_volume',
          'competition_price', 'competition_volume']
        numFields.forEach(f => {
          if (cleaned[f] === '') cleaned[f] = null
          else cleaned[f] = parseFloat(cleaned[f])
        })
        return cleaned
      })
    }

    try {
      const response = await API.post('/epr/', payload)

      if (response.status === 200 || response.status === 201) {
        setMessage('ExceptionalPrice Request Submitted Successfully!')
        setHeader({
          legacy_organization: '', soldto_code: '', soldto_name: '',
          shipto_code: '', shipto_name: '', end_customer_name: '', additional_remarks: ''
        })
        setLineItems([{ ...DEFAULT_LINE_ITEM }])
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(JSON.stringify(err.response.data))
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Exceptional Price Request</h1>
          <p style={{ color: '#666' }}>Submit an EPR for regional approvals following the mandatory workflow.</p>
        </div>
      </div>

      {message && <div style={{ background: '#d4edda', color: '#155724', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>{message}</div>}
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>Error: {error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>Organization Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Legacy Organization</label>
              <select style={inputStyle} name="legacy_organization" value={header.legacy_organization} onChange={handleHeaderChange}>
                <option value="">-- Select --</option>
                <option value="inx1">inx1</option>
                <option value="inx2">inx2</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sold-To Code</label>
              <input style={inputStyle} type="text" name="soldto_code" value={header.soldto_code} onChange={handleHeaderChange} />
            </div>
            <div>
              <label style={labelStyle}>Sold-To Name</label>
              <input style={inputStyle} type="text" name="soldto_name" value={header.soldto_name} onChange={handleHeaderChange} />
            </div>
            <div>
              <label style={labelStyle}>Ship-To Code *</label>
              <input style={inputStyle} type="text" name="shipto_code" value={header.shipto_code} onChange={handleHeaderChange} required />
            </div>
            <div>
              <label style={labelStyle}>Ship-To Name</label>
              <input style={inputStyle} type="text" name="shipto_name" value={header.shipto_name} onChange={handleHeaderChange} />
            </div>
            <div>
              <label style={labelStyle}>End Customer Name</label>
              <input style={inputStyle} type="text" name="end_customer_name" value={header.end_customer_name} onChange={handleHeaderChange} />
            </div>
          </div>
        </div>

        {/* Line Items Section (Vertical Card Layout) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>Requested Products</h2>
            <button type="button" onClick={addLineItem} style={{ background: '#1c4ed8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', boxShadow: '0 2px 4px rgba(28,78,216,0.2)' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '24px', position: 'relative' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '999px', fontSize: '13px' }}>#{index + 1}</span> 
                  {item.material_name || 'New Product Request'}
                </h3>
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLineItem(index)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>

              {/* Group 1: Product & Request Type */}
              <h4 style={sectionHeadingStyle}>Product & Request Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Material Name *</label>
                  <select style={inputStyle} value={item.material_name} onChange={e => handleLineItemChange(index, 'material_name', e.target.value)} required>
                    <option value="">-- Select Material --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.material_name}>{p.material_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Material Code</label>
                  <input style={{...inputStyle, background: '#f8fafc', cursor: 'not-allowed'}} type="text" value={item.material_code} readOnly placeholder="Auto-filled" />
                </div>
                <div>
                  <label style={labelStyle}>Business Proposal</label>
                  <select style={inputStyle} value={item.business_proposal} onChange={(e) => handleLineItemChange(index, 'business_proposal', e.target.value)}>
                    <option>New</option>
                    <option>Existing Business</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Request Type</label>
                  <select style={inputStyle} value={item.price_request_type} onChange={(e) => handleLineItemChange(index, 'price_request_type', e.target.value)}>
                    <option>New</option>
                    <option>Extn</option>
                    <option>Reduction</option>
                  </select>
                </div>
              </div>

              {/* Group 2: Volume & Pricing Details */}
              <h4 style={sectionHeadingStyle}>Volume & Pricing Comparatives</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Old Dist. Price (INR)</label>
                  <input style={inputStyle} type="number" step="0.01" value={item.existing_dist_price} onChange={e => handleLineItemChange(index, 'existing_dist_price', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Old ICP (INR)</label>
                  <input style={inputStyle} type="number" step="0.01" value={item.existing_icp} onChange={e => handleLineItemChange(index, 'existing_icp', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Old Vol. (kg/Ann)</label>
                  <input style={inputStyle} type="number" step="0.01" value={item.existing_sale_volume} onChange={e => handleLineItemChange(index, 'existing_sale_volume', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Req. Dist. Price (INR) <span style={{color: '#ef4444'}}>*</span></label>
                  <input style={{...inputStyle, borderColor: '#bfdbfe', background: '#eff6ff'}} type="number" step="0.01" value={item.requested_dist_price} onChange={e => handleLineItemChange(index, 'requested_dist_price', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Req. ICP (INR) <span style={{color: '#ef4444'}}>*</span></label>
                  <input style={{...inputStyle, borderColor: '#fed7aa', background: '#fff7ed'}} type="number" step="0.01" value={item.requested_icp} onChange={e => handleLineItemChange(index, 'requested_icp', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Proposed Vol. (kg/Mo)</label>
                  <input style={{...inputStyle, borderColor: '#bbf7d0', background: '#f0fdf4'}} type="number" step="0.01" value={item.proposed_sale_volume} onChange={e => handleLineItemChange(index, 'proposed_sale_volume', e.target.value)} />
                </div>
              </div>

              {/* Group 3: Logistics & Commercials */}
              <h4 style={sectionHeadingStyle}>Logistics & Commercials</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Freight Charges</label>
                  <select style={inputStyle} value={item.freight_charges} onChange={e => handleLineItemChange(index, 'freight_charges', e.target.value)}>
                    <option>Paid By Distributor</option>
                    <option>FTL Order</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Distributor Payment Terms</label>
                  <input style={inputStyle} type="text" value={item.distributor_payment_terms} onChange={e => handleLineItemChange(index, 'distributor_payment_terms', e.target.value)} placeholder="e.g. 30 Days" />
                </div>
                <div>
                  <label style={labelStyle}>End Customer Payment Terms</label>
                  <input style={inputStyle} type="text" value={item.end_customer_payment_terms} onChange={e => handleLineItemChange(index, 'end_customer_payment_terms', e.target.value)} placeholder="e.g. 60 Days" />
                </div>
                <div>
                  <label style={labelStyle}>Used in Package</label>
                  <select style={inputStyle} value={item.product_used_in_package} onChange={e => handleLineItemChange(index, 'product_used_in_package', e.target.value)}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Other Products Details (If used in package)</label>
                  <input style={inputStyle} type="text" value={item.other_products_details} onChange={e => handleLineItemChange(index, 'other_products_details', e.target.value)} placeholder="Describe package relationships..." />
                </div>
              </div>

              {/* Group 4: Competition & Remarks */}
              <h4 style={sectionHeadingStyle}>Competition Justification</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Competition Running</label>
                  <select style={inputStyle} value={item.competition_running} onChange={e => handleLineItemChange(index, 'competition_running', e.target.value)}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                {item.competition_running === 'Yes' && (
                  <>
                    <div>
                      <label style={labelStyle}>Competition Product Name</label>
                      <input style={inputStyle} type="text" value={item.competition_product_name} onChange={e => handleLineItemChange(index, 'competition_product_name', e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Comp. Price (INR/kg)</label>
                      <input style={inputStyle} type="number" step="0.01" value={item.competition_price} onChange={e => handleLineItemChange(index, 'competition_price', e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Comp. Volume YTD</label>
                      <input style={inputStyle} type="number" step="0.01" value={item.competition_volume} onChange={e => handleLineItemChange(index, 'competition_volume', e.target.value)} />
                    </div>
                  </>
                )}
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label style={labelStyle}>Line Item Remarks</label>
                  <input style={inputStyle} type="text" value={item.remarks} onChange={e => handleLineItemChange(index, 'remarks', e.target.value)} placeholder="Specific remarks for this request..." />
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Additional Remarks Section */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Additional Remarks</h2>
          <textarea 
            style={{ ...inputStyle, width: '100%', minHeight: '100px', resize: 'vertical' }} 
            name="additional_remarks" 
            value={header.additional_remarks} 
            onChange={handleHeaderChange} 
            placeholder="Enter any final remarks or escalations here..."
          ></textarea>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button type="button" onClick={() => window.history.back()} style={{ padding: '12px 24px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', background: loading ? '#93c5fd' : '#1d4ed8', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> {loading ? 'Submitting...' : 'Submit Price Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' }
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }
const thStyle = { padding: '12px', fontWeight: '600', color: '#475569', fontSize: '12px', whiteSpace: 'nowrap' }
const tdStyle = { padding: '8px', verticalAlign: 'top' }
const sectionHeadingStyle = { fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', color: '#64748b', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }
