import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

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
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
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
      const response = await fetch('/api/epr/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setMessage('Exceptional Price Request Submitted Successfully!')
        setHeader({
          legacy_organization: '', soldto_code: '', soldto_name: '',
          shipto_code: '', shipto_name: '', end_customer_name: '', additional_remarks: ''
        })
        setLineItems([{ ...DEFAULT_LINE_ITEM }])
      } else {
        const errorData = await response.json()
        setError(JSON.stringify(errorData))
      }
    } catch (err) {
      setError(err.message)
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Legacy Organization</label>
              <input style={inputStyle} type="text" name="legacy_organization" value={header.legacy_organization} onChange={handleHeaderChange} />
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

        {/* Line Items Table */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Requested Products</h2>
            <button type="button" onClick={addLineItem} style={{ background: '#1c4ed8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Add Row
            </button>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '2000px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={thStyle}>Sr. No</th>
                  <th style={thStyle}>Business Proposal</th>
                  <th style={thStyle}>Request Type</th>
                  <th style={thStyle}>Mat. Code</th>
                  <th style={thStyle}>Material Name</th>
                  <th style={thStyle}>Old Dist. Price (INR)</th>
                  <th style={thStyle}>Old ICP (INR)</th>
                  <th style={thStyle}>Old Vol. (kg/Ann)</th>
                  <th style={thStyle}>Req. Dist. Price (INR)</th>
                  <th style={thStyle}>Req. ICP (INR)</th>
                  <th style={thStyle}>Proposed Vol. (kg/Mo)</th>
                  <th style={thStyle}>Freight Charges</th>
                  <th style={thStyle}>Dist. Payment Terms</th>
                  <th style={thStyle}>Customer Payment</th>
                  <th style={thStyle}>Used in Package</th>
                  <th style={thStyle}>Other Package Details</th>
                  <th style={thStyle}>Competition Running</th>
                  <th style={thStyle}>Competition Name</th>
                  <th style={thStyle}>Comp. Price (INR/kg)</th>
                  <th style={thStyle}>Comp. Vol. YTD</th>
                  <th style={thStyle}>Remarks</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>
                      <select style={inputStyle} value={item.business_proposal} onChange={(e) => handleLineItemChange(index, 'business_proposal', e.target.value)}>
                        <option>New</option>
                        <option>Existing Business</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <select style={inputStyle} value={item.price_request_type} onChange={(e) => handleLineItemChange(index, 'price_request_type', e.target.value)}>
                        <option>New</option>
                        <option>Extn</option>
                        <option>Reduction</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input style={{...inputStyle, background: '#f3f4f6', cursor: 'not-allowed'}} type="text" value={item.material_code} onChange={e => handleLineItemChange(index, 'material_code', e.target.value)} readOnly placeholder="Auto" />
                    </td>
                    <td style={tdStyle}>
                      <select style={inputStyle} value={item.material_name} onChange={e => handleLineItemChange(index, 'material_name', e.target.value)}>
                        <option value="">-- Select Material --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.material_name}>{p.material_name}</option>
                        ))}
                      </select>
                    </td>
                    
                    <td style={tdStyle}><input style={inputStyle} type="number" step="0.01" value={item.existing_dist_price} onChange={e => handleLineItemChange(index, 'existing_dist_price', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="number" step="0.01" value={item.existing_icp} onChange={e => handleLineItemChange(index, 'existing_icp', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="number" step="0.01" value={item.existing_sale_volume} onChange={e => handleLineItemChange(index, 'existing_sale_volume', e.target.value)} /></td>
                    
                    <td style={tdStyle}><input style={{...inputStyle, background: '#e0f2fe'}} type="number" step="0.01" value={item.requested_dist_price} onChange={e => handleLineItemChange(index, 'requested_dist_price', e.target.value)} /></td>
                    <td style={tdStyle}><input style={{...inputStyle, background: '#ffedd5'}} type="number" step="0.01" value={item.requested_icp} onChange={e => handleLineItemChange(index, 'requested_icp', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="number" step="0.01" value={item.proposed_sale_volume} onChange={e => handleLineItemChange(index, 'proposed_sale_volume', e.target.value)} /></td>
                    
                    <td style={tdStyle}>
                      <select style={inputStyle} value={item.freight_charges} onChange={e => handleLineItemChange(index, 'freight_charges', e.target.value)}>
                        <option>Paid By Distributor</option>
                        <option>FTL Order</option>
                      </select>
                    </td>
                    <td style={tdStyle}><input style={inputStyle} type="text" value={item.distributor_payment_terms} onChange={e => handleLineItemChange(index, 'distributor_payment_terms', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="text" value={item.end_customer_payment_terms} onChange={e => handleLineItemChange(index, 'end_customer_payment_terms', e.target.value)} /></td>
                    
                    <td style={tdStyle}>
                      <select style={inputStyle} value={item.product_used_in_package} onChange={e => handleLineItemChange(index, 'product_used_in_package', e.target.value)}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>
                    <td style={tdStyle}><input style={inputStyle} type="text" value={item.other_products_details} onChange={e => handleLineItemChange(index, 'other_products_details', e.target.value)} /></td>
                    
                    <td style={tdStyle}>
                      <select style={inputStyle} value={item.competition_running} onChange={e => handleLineItemChange(index, 'competition_running', e.target.value)}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>
                    <td style={tdStyle}><input style={inputStyle} type="text" value={item.competition_product_name} onChange={e => handleLineItemChange(index, 'competition_product_name', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="number" step="0.01" value={item.competition_price} onChange={e => handleLineItemChange(index, 'competition_price', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="number" step="0.01" value={item.competition_volume} onChange={e => handleLineItemChange(index, 'competition_volume', e.target.value)} /></td>
                    <td style={tdStyle}><input style={inputStyle} type="text" value={item.remarks} onChange={e => handleLineItemChange(index, 'remarks', e.target.value)} /></td>
                    <td style={tdStyle}>
                      <button type="button" onClick={() => removeLineItem(index)} style={{ background: 'transparent', border: 'none', color: lineItems.length > 1 ? '#ef4444' : '#ccc', cursor: lineItems.length > 1 ? 'pointer' : 'not-allowed' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
