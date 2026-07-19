import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import API from '../api'
import SearchableSelect from '../components/SearchableSelect'

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
        setMessage('Exceptional Price Request Submitted Successfully!')
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
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Exceptional Price Request</h1>
          <p className="page-subtitle">Submit an EPR for regional approvals following the mandatory workflow.</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          <span className="alert-title">Success</span>
          <p>{message}</p>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span className="alert-title">Submission Error</span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--primary)' }}>Organization Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label>Legacy Organization</label>
              <select name="legacy_organization" value={header.legacy_organization} onChange={handleHeaderChange}>
                <option value="">-- Select --</option>
                <option value="inx1">inx1</option>
                <option value="inx2">inx2</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sold-To Code</label>
              <input type="text" name="soldto_code" value={header.soldto_code} onChange={handleHeaderChange} />
            </div>
            <div className="form-group">
              <label>Sold-To Name</label>
              <input type="text" name="soldto_name" value={header.soldto_name} onChange={handleHeaderChange} />
            </div>
            <div className="form-group">
              <label>Ship-To Code *</label>
              <input type="text" name="shipto_code" value={header.shipto_code} onChange={handleHeaderChange} required />
            </div>
            <div className="form-group">
              <label>Ship-To Name</label>
              <input type="text" name="shipto_name" value={header.shipto_name} onChange={handleHeaderChange} />
            </div>
            <div className="form-group">
              <label>End Customer Name</label>
              <input type="text" name="end_customer_name" value={header.end_customer_name} onChange={handleHeaderChange} />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>Requested Products</h2>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                  {item.material_name || `Product Request #${index + 1}`}
                </h3>
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLineItem(index)} className="btn btn-danger" style={{ padding: '6px 16px', fontSize: '12px' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>

              {/* Group 1: Product & Request Type */}
              <h4 style={sectionHeadingStyle}>Product & Request Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Material Name *</label>
                  <SearchableSelect 
                    options={products}
                    value={item.material_name}
                    onChange={val => handleLineItemChange(index, 'material_name', val)}
                    placeholder="-- Select Material --"
                    labelKey="material_name"
                    valueKey="material_name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Material Code</label>
                  <input style={{ background: 'var(--surface2)', cursor: 'not-allowed' }} type="text" value={item.material_code} readOnly placeholder="Auto-filled" />
                </div>
                <div className="form-group">
                  <label>Business Proposal</label>
                  <select value={item.business_proposal} onChange={(e) => handleLineItemChange(index, 'business_proposal', e.target.value)}>
                    <option>New</option>
                    <option>Existing Business</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Request Type</label>
                  <select value={item.price_request_type} onChange={(e) => handleLineItemChange(index, 'price_request_type', e.target.value)}>
                    <option>New</option>
                    <option>Extn</option>
                    <option>Reduction</option>
                  </select>
                </div>
              </div>

              {/* Group 2: Volume & Pricing Details */}
              <h4 style={sectionHeadingStyle}>Volume & Pricing Comparatives</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Old Dist. Price (INR)</label>
                  <input type="number" step="0.01" value={item.existing_dist_price} onChange={e => handleLineItemChange(index, 'existing_dist_price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Req. Dist. Price (INR) *</label>
                  <input style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'var(--green-soft)', fontWeight: 600 }} type="number" step="0.01" value={item.requested_dist_price} onChange={e => handleLineItemChange(index, 'requested_dist_price', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Old ICP (INR)</label>
                  <input type="number" step="0.01" value={item.existing_icp} onChange={e => handleLineItemChange(index, 'existing_icp', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Req. ICP (INR) *</label>
                  <input style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'var(--amber-soft)', fontWeight: 600 }} type="number" step="0.01" value={item.requested_icp} onChange={e => handleLineItemChange(index, 'requested_icp', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Old Vol. (kg/Ann)</label>
                  <input type="number" step="0.01" value={item.existing_sale_volume} onChange={e => handleLineItemChange(index, 'existing_sale_volume', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Proposed Vol. (kg/Mo)</label>
                  <input style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'var(--green-soft)' }} type="number" step="0.01" value={item.proposed_sale_volume} onChange={e => handleLineItemChange(index, 'proposed_sale_volume', e.target.value)} />
                </div>
              </div>



              {/* Group 4: Competition & Remarks */}
              <h4 style={sectionHeadingStyle}>Competition Justification</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label>Competition Running</label>
                  <select value={item.competition_running} onChange={e => handleLineItemChange(index, 'competition_running', e.target.value)}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                {item.competition_running === 'Yes' && (
                  <>
                    <div className="form-group">
                      <label>Competition Product Name</label>
                      <input type="text" value={item.competition_product_name} onChange={e => handleLineItemChange(index, 'competition_product_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Comp. Price (INR/kg)</label>
                      <input type="number" step="0.01" value={item.competition_price} onChange={e => handleLineItemChange(index, 'competition_price', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Comp. Volume YTD</label>
                      <input type="number" step="0.01" value={item.competition_volume} onChange={e => handleLineItemChange(index, 'competition_volume', e.target.value)} />
                    </div>
                  </>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label>Line Item Remarks</label>
                  <input type="text" value={item.remarks} onChange={e => handleLineItemChange(index, 'remarks', e.target.value)} placeholder="Specific remarks for this request..." />
                </div>
              </div>

            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px', marginBottom: '16px' }}>
            <button type="button" onClick={addLineItem} className="btn btn-primary">
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* Additional Remarks Section */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>Additional Remarks</h2>
          <textarea 
            name="additional_remarks" 
            value={header.additional_remarks} 
            onChange={handleHeaderChange} 
            placeholder="Enter any final remarks or escalations here..."
          ></textarea>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '40px' }}>
          <button type="button" onClick={() => window.history.back()} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save size={18} /> {loading ? 'Submitting...' : 'Submit Price Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

const sectionHeadingStyle = { 
  fontSize: '12px', 
  textTransform: 'uppercase', 
  letterSpacing: '0.06em', 
  fontWeight: '800', 
  color: 'var(--text-dim)', 
  marginBottom: '16px', 
  borderBottom: '1px solid var(--border)', 
  paddingBottom: '6px',
  marginTop: '8px'
}
