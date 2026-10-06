import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react'
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

const SOLD_TO_OPTIONS = [
  { code: '438498', name: 'Chemielink' },
  { code: '441522', name: 'Chemie Link' }
]

const SHIPTO_BY_SOLDTO = {
  '438498': [
    { code: '438498', name: 'CHEMIELINK', customer: 'Shahi Exports' },
    { code: '438499', name: 'CHEMIELINK', customer: 'Shahi Exports' },
    { code: '439061', name: 'Shahi Exports Pvt. Ltd. (WPD)', customer: 'Shahi WPD' },
    { code: '439062', name: 'Shahi Exports Pvt Ltd (KPD)', customer: 'Shahi KPD' },
    { code: '441355', name: 'CHEMIELINK', customer: 'Shahi Exports' },
  ],
  '441522': [
    { code: '441522', name: 'CHEMIE LINK', customer: 'Himatsingka' },
    { code: '320408', name: 'Himatsingka Linens', customer: 'Himatsingka Linens' },
  ]
}

const END_CUSTOMERS_BY_SOLDTO = {
  '438498': ['Shahi Exports', 'Shahi KPD', 'Shahi WPD'],
  '441522': ['Himatsingka', 'Himatsingka Linens', 'Himatsingka Sheeting', 'Himatsingka Terry']
}

const DEFAULT_HEADER = {
  legacy_organization: '',
  soldto_code: '438498',
  soldto_name: 'Chemielink',
  shipto_code: '',
  shipto_name: '',
  end_customer_name: '',
  additional_remarks: ''
}

export default function ExceptionalPriceRequestPage() {
  const [header, setHeader] = useState({ ...DEFAULT_HEADER })
  const [lineItems, setLineItems] = useState([{ ...DEFAULT_LINE_ITEM }])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [monthlySales, setMonthlySales] = useState([])
  const [submittedEprs, setSubmittedEprs] = useState([])
  const [fetchingSubmitted, setFetchingSubmitted] = useState(false)
  const [expandedEprIds, setExpandedEprIds] = useState(new Set())

  const fetchSubmittedEprs = async (highlightId = null) => {
    setFetchingSubmitted(true)
    try {
      const res = await API.get('/epr/')
      const data = Array.isArray(res.data) ? res.data : []
      data.sort((a, b) => b.id - a.id)
      setSubmittedEprs(data)
      if (highlightId) {
        setExpandedEprIds(prev => new Set([...prev, highlightId]))
      } else if (data.length > 0 && expandedEprIds.size === 0) {
        setExpandedEprIds(new Set([data[0].id]))
      }
    } catch (err) {
      console.error("Failed to load submitted EPRs", err)
    } finally {
      setFetchingSubmitted(false)
    }
  }

  useEffect(() => {
    API.get('/products/')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Failed to load products", err))

    API.get('/monthly-sales/?distributor=ALL')
      .then(res => setMonthlySales(res.data))
      .catch(err => console.error("Failed to load monthly sales", err))

    fetchSubmittedEprs()
  }, [])

  const toggleExpand = (id) => {
    setExpandedEprIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleExpandAll = () => {
    if (expandedEprIds.size === submittedEprs.length) {
      setExpandedEprIds(new Set())
    } else {
      setExpandedEprIds(new Set(submittedEprs.map(e => e.id)))
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="badge badge-status badge-green">Approved</span>
    if (status === 'Rejected' || status === 'Sent Back to Distributor') return <span className="badge badge-status badge-amber">Sent Back to Distributor</span>
    if (status === 'Draft') return <span className="badge badge-status badge-accent">Draft</span>
    return <span className="badge badge-status badge-amber">{status || 'Pending'}</span>
  }

  const currentSoldToCode = header.soldto_code || '438498'
  const currentShipToOptions = SHIPTO_BY_SOLDTO[currentSoldToCode] || []
  const currentEndCustomerOptions = END_CUSTOMERS_BY_SOLDTO[currentSoldToCode] || []

  const getSecondarySales = (matName, matCode, productObj) => {
    if (!matName && !matCode) return null
    const norm = (s) => (s || '').toLowerCase().replace(/[\s\u00a0]+/g, ' ').trim()
    const targetName = norm(matName)
    const targetCode = (matCode || '').trim()

    const matches = monthlySales.filter(m => {
      const mCode = (m.product_code || '').trim()
      if (targetCode && mCode && targetCode === mCode) return true
      const mName = norm(m.product_name)
      if (mName && targetName) {
        if (mName === targetName) return true
        if (mName.length > 4 && (targetName.includes(mName) || mName.includes(targetName))) return true
      }
      return false
    })

    if (!matches.length) return null

    const totalVol = matches.reduce((sum, m) => sum + (parseFloat(m.total_volume) || 0), 0)
    const totalVal = matches.reduce((sum, m) => sum + (parseFloat(m.total_value) || 0), 0)

    if (totalVol <= 0) return null

    const avgPrice = totalVal > 0 ? Math.round((totalVal / totalVol) * 100) / 100 : ''
    const icp = (productObj && productObj.special_price) ? productObj.special_price : ''

    return {
      hasSales: true,
      volume: Math.round(totalVol * 100) / 100,
      price: avgPrice,
      icp: icp
    }
  }

  const handleHeaderChange = (e) => {
    const { name, value } = e.target
    if (name === 'soldto_name') {
      const match = SOLD_TO_OPTIONS.find(opt => opt.name === value)
      const newCode = match ? match.code : header.soldto_code
      setHeader(prev => ({
        ...prev,
        soldto_name: value,
        soldto_code: newCode,
        shipto_code: '',
        shipto_name: '',
        end_customer_name: ''
      }))
    } else if (name === 'soldto_code') {
      const match = SOLD_TO_OPTIONS.find(opt => opt.code === value.trim())
      setHeader(prev => ({
        ...prev,
        soldto_code: value,
        soldto_name: match ? match.name : prev.soldto_name,
        shipto_code: '',
        shipto_name: '',
        end_customer_name: ''
      }))
    } else if (name === 'shipto_code') {
      const options = SHIPTO_BY_SOLDTO[header.soldto_code] || []
      const match = options.find(opt => opt.code === value)
      setHeader(prev => ({
        ...prev,
        shipto_code: value,
        shipto_name: match ? match.name : prev.shipto_name,
        end_customer_name: (match && match.customer) ? match.customer : prev.end_customer_name
      }))
    } else if (name === 'shipto_name') {
      const options = SHIPTO_BY_SOLDTO[header.soldto_code] || []
      const match = options.find(opt => opt.name === value)
      setHeader(prev => ({
        ...prev,
        shipto_name: value,
        shipto_code: match ? match.code : prev.shipto_code,
        end_customer_name: (match && match.customer) ? match.customer : prev.end_customer_name
      }))
    } else {
      setHeader(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    
    if (field === 'material_name') {
      const selectedProduct = products.find(p => p.material_name === value)
      const matCode = selectedProduct ? selectedProduct.material_code : ''
      updated[index]['material_code'] = matCode
      
      if (updated[index]['business_proposal'] === 'Existing Business') {
        const secSales = getSecondarySales(value, matCode, selectedProduct)
        if (secSales && secSales.hasSales) {
          updated[index]['existing_dist_price'] = secSales.price != null ? secSales.price : ''
          updated[index]['existing_sale_volume'] = secSales.volume != null ? secSales.volume : ''
          updated[index]['existing_icp'] = secSales.icp != null ? secSales.icp : ''
        } else {
          updated[index]['existing_dist_price'] = ''
          updated[index]['existing_sale_volume'] = ''
          updated[index]['existing_icp'] = ''
        }
      } else {
        updated[index]['existing_dist_price'] = ''
        updated[index]['existing_sale_volume'] = ''
        updated[index]['existing_icp'] = ''
      }
    } else if (field === 'business_proposal') {
      if (value === 'Existing Business') {
        const matName = updated[index]['material_name']
        const matCode = updated[index]['material_code']
        const selectedProduct = products.find(p => p.material_name === matName)
        const secSales = getSecondarySales(matName, matCode, selectedProduct)
        if (secSales && secSales.hasSales) {
          updated[index]['existing_dist_price'] = secSales.price != null ? secSales.price : ''
          updated[index]['existing_sale_volume'] = secSales.volume != null ? secSales.volume : ''
          updated[index]['existing_icp'] = secSales.icp != null ? secSales.icp : ''
        } else {
          updated[index]['existing_dist_price'] = ''
          updated[index]['existing_sale_volume'] = ''
          updated[index]['existing_icp'] = ''
        }
      } else {
        // If 'New', do not autofill (leave empty)
        updated[index]['existing_dist_price'] = ''
        updated[index]['existing_sale_volume'] = ''
        updated[index]['existing_icp'] = ''
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

    // Validation: Old ICP is mandatory when Business Proposal is Existing Business
    for (let i = 0; i < lineItems.length; i++) {
      const it = lineItems[i]
      if (it.business_proposal === 'Existing Business' && (it.existing_icp === '' || it.existing_icp === null || it.existing_icp === undefined)) {
        setError(`Old ICP is mandatory for line item #${i + 1} (${it.material_name || 'Product'}) under Existing Business.`)
        setLoading(false)
        return
      }
      if (it.competition_running === 'Yes') {
        if (!it.competition_product_name || !it.competition_product_name.trim()) {
          setError(`Competition Product Name is mandatory for line item #${i + 1} (${it.material_name || 'Product'}) when Competition is running.`)
          setLoading(false)
          return
        }
        if (it.competition_price === '' || it.competition_price === null || it.competition_price === undefined) {
          setError(`Competition Price is mandatory for line item #${i + 1} (${it.material_name || 'Product'}) when Competition is running.`)
          setLoading(false)
          return
        }
        if (it.competition_volume === '' || it.competition_volume === null || it.competition_volume === undefined) {
          setError(`Comp. Volume Monthly Avg is mandatory for line item #${i + 1} (${it.material_name || 'Product'}) when Competition is running.`)
          setLoading(false)
          return
        }
      }
    }

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
        setHeader({ ...DEFAULT_HEADER })
        setLineItems([{ ...DEFAULT_LINE_ITEM }])
        const newId = response.data?.id
        await fetchSubmittedEprs(newId)
        setTimeout(() => {
          const el = document.getElementById('submitted-eprs-section')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }, 150)
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
              <input
                type="text"
                name="soldto_code"
                value={header.soldto_code}
                onChange={handleHeaderChange}
                placeholder="Auto-filled"
              />
            </div>
            <div className="form-group">
              <label>Sold-To Name</label>
              <select
                name="soldto_name"
                value={header.soldto_name}
                onChange={handleHeaderChange}
              >
                {SOLD_TO_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ship-To Code *</label>
              <select
                name="shipto_code"
                value={header.shipto_code}
                onChange={handleHeaderChange}
                required
              >
                <option value="">-- Select Ship-To Code --</option>
                {currentShipToOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} ({opt.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ship-To Name</label>
              <select
                name="shipto_name"
                value={header.shipto_name}
                onChange={handleHeaderChange}
              >
                <option value="">-- Select Ship-To Name --</option>
                {currentShipToOptions.map(opt => (
                  <option key={opt.code} value={opt.name}>
                    {opt.name} ({opt.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>End Customer Name</label>
              <select
                name="end_customer_name"
                value={header.end_customer_name}
                onChange={handleHeaderChange}
              >
                <option value="">-- Select End Customer --</option>
                {currentEndCustomerOptions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
                  <label>
                    Old ICP (INR) {item.business_proposal === 'Existing Business' && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.existing_icp}
                    onChange={e => handleLineItemChange(index, 'existing_icp', e.target.value)}
                    required={item.business_proposal === 'Existing Business'}
                    placeholder={item.business_proposal === 'Existing Business' ? 'Mandatory' : ''}
                  />
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
                      <label>
                        Competition Product Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={item.competition_product_name}
                        onChange={e => handleLineItemChange(index, 'competition_product_name', e.target.value)}
                        required
                        placeholder="Enter competition product"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Comp. Price (INR/kg) <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.competition_price}
                        onChange={e => handleLineItemChange(index, 'competition_price', e.target.value)}
                        required
                        placeholder="e.g. 250.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Comp. Volume Monthly Avg <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.competition_volume}
                        onChange={e => handleLineItemChange(index, 'competition_volume', e.target.value)}
                        required
                        placeholder="e.g. 500"
                      />
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

      {/* Submitted EPRs Section */}
      <div id="submitted-eprs-section" className="card" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
                Submitted Price Requests
              </h2>
              <span className="badge badge-accent" style={{ fontSize: '11px' }}>
                {submittedEprs.length} {submittedEprs.length === 1 ? 'Request' : 'Requests'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-dim)' }}>
              All submitted exceptional price requests with line item details and current status
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {submittedEprs.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {expandedEprIds.size === submittedEprs.length ? 'Collapse All' : 'Expand All'}
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchSubmittedEprs()}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={fetchingSubmitted}
              title="Refresh submitted requests"
            >
              <RefreshCw size={14} className={fetchingSubmitted ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {fetchingSubmitted && submittedEprs.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Loader2 size={20} className="animate-spin" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
            Loading submitted requests...
          </div>
        ) : submittedEprs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg)', borderRadius: '10px' }}>
            No price requests submitted yet. Submit a request above to see it here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submittedEprs.map((epr) => {
              const isExpanded = expandedEprIds.has(epr.id)
              const dateStr = epr.created_at ? new Date(epr.created_at).toLocaleString() : 'N/A'
              const itemCount = epr.line_items?.length || 0

              return (
                <div
                  key={epr.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  {/* Card Header / Summary Bar */}
                  <div
                    onClick={() => toggleExpand(epr.id)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--bg)' : 'var(--surface)',
                      borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.2s ease',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--primary)' }}>
                        EPR-{epr.id}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                        {dateStr}
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                        <span>Sold-To: <strong>{epr.soldto_name || 'N/A'}</strong> ({epr.soldto_code || '-'})</span>
                        {epr.shipto_name && (
                          <span style={{ marginLeft: '12px', color: 'var(--text-dim)' }}>
                            → Ship-To: <strong style={{ color: 'var(--text)' }}>{epr.shipto_name}</strong> ({epr.shipto_code || '-'})
                          </span>
                        )}
                        {epr.end_customer_name && (
                          <span style={{ marginLeft: '12px', color: 'var(--text-dim)' }}>
                            | End Customer: <strong style={{ color: 'var(--text)' }}>{epr.end_customer_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                      {getStatusBadge(epr.status)}
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(epr.id)
                        }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body: Complete Submitted Data */}
                  {isExpanded && (
                    <div style={{ padding: '20px', background: 'var(--surface)' }}>
                      {/* Organization & Header Details Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '14px',
                          marginBottom: '20px',
                          padding: '14px 16px',
                          borderRadius: '8px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div>
                          <span style={detailLabelStyle}>Legacy Organization</span>
                          <div style={detailValueStyle}>{epr.legacy_organization || '-'}</div>
                        </div>
                        <div>
                          <span style={detailLabelStyle}>Sold-To Party</span>
                          <div style={detailValueStyle}>{epr.soldto_name || '-'} ({epr.soldto_code || '-'})</div>
                        </div>
                        <div>
                          <span style={detailLabelStyle}>Ship-To Party</span>
                          <div style={detailValueStyle}>{epr.shipto_name || '-'} ({epr.shipto_code || '-'})</div>
                        </div>
                        <div>
                          <span style={detailLabelStyle}>End Customer</span>
                          <div style={detailValueStyle}>{epr.end_customer_name || '-'}</div>
                        </div>
                        <div>
                          <span style={detailLabelStyle}>Status</span>
                          <div>{getStatusBadge(epr.status)}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={detailLabelStyle}>Additional Remarks</span>
                          <div style={{ ...detailValueStyle, fontStyle: epr.additional_remarks ? 'normal' : 'italic' }}>
                            {epr.additional_remarks || 'None'}
                          </div>
                        </div>
                      </div>

                      {/* Products / Line Items Table */}
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px' }}>
                        Requested Products ({itemCount})
                      </h4>

                      <div className="table-wrapper" style={{ margin: 0 }}>
                        <table style={{ borderSpacing: '0 4px' }}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Product</th>
                              <th>Proposal</th>
                              <th>Req. Type</th>
                              <th>Old Dist / ICP</th>
                              <th>Req. Dist / ICP</th>
                              <th>Old / Proposed Vol</th>
                              <th>Freight</th>
                              <th>Competition</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(!epr.line_items || epr.line_items.length === 0) ? (
                              <tr>
                                <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '12px' }}>
                                  No line items found.
                                </td>
                              </tr>
                            ) : (
                              epr.line_items.map((item, idx) => (
                                <tr key={item.id || idx}>
                                  <td style={{ fontWeight: '700' }}>{idx + 1}</td>
                                  <td>
                                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>
                                      {item.material_name || '-'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                      Code: {item.material_code || '-'}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge badge-accent" style={{ fontSize: '11px' }}>
                                      {item.business_proposal || '-'}
                                    </span>
                                  </td>
                                  <td>{item.price_request_type || '-'}</td>
                                  <td>
                                    <div>Dist: {item.existing_dist_price != null ? `₹${item.existing_dist_price}` : '-'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                      ICP: {item.existing_icp != null ? `₹${item.existing_icp}` : '-'}
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: '800', color: 'var(--primary)' }}>
                                      Dist: {item.requested_dist_price != null ? `₹${item.requested_dist_price}` : '-'}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)' }}>
                                      ICP: {item.requested_icp != null ? `₹${item.requested_icp}` : '-'}
                                    </div>
                                  </td>
                                  <td>
                                    <div>Old: {item.existing_sale_volume != null ? `${item.existing_sale_volume} kg` : '-'}</div>
                                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>
                                      Prop: {item.proposed_sale_volume != null ? `${item.proposed_sale_volume} kg` : '-'}
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '12px' }}>
                                    <div>{item.freight_charges || '-'}</div>
                                    {(item.distributor_payment_terms || item.end_customer_payment_terms) && (
                                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                        Pay: {item.distributor_payment_terms || '-'} / {item.end_customer_payment_terms || '-'}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ fontSize: '12px' }}>
                                    {item.competition_running === 'Yes' ? (
                                      <div>
                                        <div style={{ fontWeight: '600', color: 'var(--amber)' }}>Yes: {item.competition_product_name || '-'}</div>
                                        <div>₹{item.competition_price || '-'} | Vol: {item.competition_volume || '-'}</div>
                                      </div>
                                    ) : (
                                      <span style={{ color: 'var(--text-dim)' }}>No</span>
                                    )}
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '160px', wordBreak: 'break-word' }}>
                                    {item.remarks || '-'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
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

const detailLabelStyle = { display: 'block', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }
const detailValueStyle = { fontSize: '13px', color: 'var(--text)', fontWeight: '600' }
