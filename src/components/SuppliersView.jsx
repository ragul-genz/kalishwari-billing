import React from 'react';
import {
  Truck,
  PlusCircle,
  Search,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Edit,
  Building2,
  CheckCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cleanPhoneNumber } from '../utils/whatsapp';

export function SuppliersView({
  suppliers = [],
  setSuppliers,
  activeYear = '2026',
  showToast,
  promptConfirm
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editSupplier, setEditSupplier] = React.useState(null);

  // Form inputs
  const [name, setName] = React.useState('');
  const [contactPerson, setContactPerson] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [gstin, setGstin] = React.useState('');
  const [category, setCategory] = React.useState('Crackers & Sparklers');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.mobile || '').includes(searchTerm) ||
    String(s.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = (e) => {
    e.preventDefault();
    if (!name || !mobile) {
      showToast('Supplier Name and Mobile are required!');
      return;
    }

    const newSup = {
      id: Date.now(),
      name,
      contactPerson: contactPerson || name,
      mobile,
      address: address || 'Sivakasi, Tamil Nadu',
      gstin: gstin || '-',
      category: category || 'Crackers Manufacturer'
    };

    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    try {
      localStorage.setItem(`kalieswari_suppliers_${activeYear}`, JSON.stringify(updated));
    } catch (e) {}

    setIsModalOpen(false);
    setName('');
    setContactPerson('');
    setMobile('');
    setAddress('');
    setGstin('');
    showToast(`✓ Supplier "${newSup.name}" added successfully!`);
    try { confetti({ particleCount: 40, spread: 50 }); } catch (c) {}
  };

  const handleUpdateSupplier = (e) => {
    e.preventDefault();
    if (!editSupplier) return;
    const updated = suppliers.map(s => s.id === editSupplier.id ? editSupplier : s);
    setSuppliers(updated);
    try {
      localStorage.setItem(`kalieswari_suppliers_${activeYear}`, JSON.stringify(updated));
    } catch (e) {}
    setEditSupplier(null);
    showToast(`✓ Supplier "${editSupplier.name}" updated!`);
  };

  const handleDeleteSupplier = (sup) => {
    const doDelete = () => {
      const updated = suppliers.filter(s => s.id !== sup.id);
      setSuppliers(updated);
      try {
        localStorage.setItem(`kalieswari_suppliers_${activeYear}`, JSON.stringify(updated));
      } catch (e) {}
      showToast(`Supplier "${sup.name}" removed`);
    };

    if (promptConfirm) {
      promptConfirm({
        title: `Delete Supplier "${sup.name}"?`,
        message: `Are you sure you want to remove supplier "${sup.name}" from your Sivakasi vendors directory?`,
        confirmLabel: 'Yes, Delete Supplier',
        confirmColor: '#DC2626',
        onConfirm: doDelete
      });
    } else {
      doDelete();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
              Suppliers &amp; Manufacturers Directory (விநியோகஸ்தர்கள்)
            </h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748B' }}>
              Manage factory units, fireworks vendors, raw material suppliers &amp; contacts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
            color: '#FFFFFF',
            border: 'none',
            padding: '11px 20px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
          }}
        >
          <PlusCircle size={16} />
          <span>+ Add Supplier (புதிய விநியோகஸ்தர்)</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search suppliers by name, phone, category..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
          Total Registered: <span style={{ color: '#4F46E5', fontWeight: '900' }}>{suppliers.length} Vendors</span>
        </div>
      </div>

      {/* Suppliers Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '18px'
      }}>
        {filteredSuppliers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            border: '1px dashed #CBD5E1',
            color: '#94A3B8'
          }}>
            <Truck size={36} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
            <div style={{ fontWeight: '800', fontSize: '15px', color: '#475569' }}>No Suppliers Found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Click "+ Add Supplier" to record your Sivakasi cracker factory vendors!</div>
          </div>
        ) : (
          filteredSuppliers.map(sup => (
            <div
              key={sup.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      background: '#EEF2FF',
                      color: '#4338CA',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      {sup.category || 'Manufacturer'}
                    </span>
                    <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                      {sup.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                      Contact: <b>{sup.contactPerson || '-'}</b>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      title="Edit Supplier"
                      onClick={() => setEditSupplier(sup)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      type="button"
                      title="Delete Supplier"
                      onClick={() => handleDeleteSupplier(sup)}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FECACA',
                        color: '#EF4444',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="#64748B" />
                    <span><b>{sup.mobile}</b></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <MapPin size={13} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{sup.address || 'Sivakasi, Tamil Nadu'}</span>
                  </div>
                  {sup.gstin && sup.gstin !== '-' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B' }}>
                      <FileText size={12} />
                      <span>GSTIN: <b>{sup.gstin}</b></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <a
                  href={`tel:${sup.mobile}`}
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/91${cleanPhoneNumber(sup.mobile)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    background: '#DCFCE7',
                    border: '1px solid #BBF7D0',
                    color: '#16A34A',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Supplier */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
              Add New Supplier (புதிய விநியோகஸ்தர்)
            </h3>

            <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Supplier / Factory Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sivakasi Fireworks Factory Unit 1" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Contact Person Name</label>
                <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. Murugesan" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Phone / Mobile Number *</label>
                <input type="text" required value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 9842100000" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Supply Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <option value="Crackers & Sparklers">Crackers &amp; Sparklers (பட்டாசு வகைகள்)</option>
                  <option value="Fancy Shots & Aerial">Fancy Shots &amp; Aerial (வானவேடிக்கை)</option>
                  <option value="Raw Materials & Chemicals">Raw Materials &amp; Chemicals</option>
                  <option value="Paper Tubes & Packaging">Paper Tubes &amp; Packaging Boxes</option>
                  <option value="General Vendor">General Vendor</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Address / Factory Location</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Vembakottai Road, Sivakasi" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>GSTIN (Optional)</label>
                <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="33AAAAA0000A1Z5" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#FFF', fontWeight: '800', cursor: 'pointer' }}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Supplier */}
      {editSupplier && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
              Edit Supplier ({editSupplier.name})
            </h3>

            <form onSubmit={handleUpdateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Supplier Name *</label>
                <input type="text" required value={editSupplier.name} onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Contact Person</label>
                <input type="text" value={editSupplier.contactPerson || ''} onChange={e => setEditSupplier({ ...editSupplier, contactPerson: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                <input type="text" required value={editSupplier.mobile} onChange={e => setEditSupplier({ ...editSupplier, mobile: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Address</label>
                <input type="text" value={editSupplier.address || ''} onChange={e => setEditSupplier({ ...editSupplier, address: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditSupplier(null)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#FFF', fontWeight: '800', cursor: 'pointer' }}>Update Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
