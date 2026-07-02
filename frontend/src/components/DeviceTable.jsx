import React, { useState, useEffect } from 'react';
import axios from '../utils/api'; // use the axios instance we created earlier
import { FaEdit, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceForm from './DeviceForm';
import SearchBar from './SearchBar';
import FilterSelect from './FilterSelect';
import Pagination from './Pagination';

/**
 * Device management table with CRUD operations, search, filter and pagination.
 */
export default function DeviceTable() {
  const [devices, setDevices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch devices whenever pagination / search / filter changes
  useEffect(() => {
    fetchDevices();
  }, [page, search, statusFilter]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = {
        _page: page,
        _limit: limit,
        q: search,
        status: statusFilter,
      };
      const { data, headers } = await axios.get('/devices', { params });
      setDevices(data);
      // Assuming backend sends total count in a header "x-total-count"
      setTotal(parseInt(headers['x-total-count'] || data.length, 10));
    } catch (err) {
      console.error('Failed to fetch devices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await axios.delete(`/devices/${id}`);
      fetchDevices();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const openForm = (device = null) => {
    setEditingDevice(device);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDevice(null);
  };

  const handleFormSuccess = () => {
    closeForm();
    fetchDevices();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search IP, hostname…" />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'All Status' }, { value: 'ONLINE', label: 'Online' }, { value: 'OFFLINE', label: 'Offline' }]}
          />
        </div>
        <button
          onClick={() => openForm()}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
        >
          Add Device
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-2 text-left">IP</th>
              <th className="p-2 text-left">Hostname</th>
              <th className="p-2 text-left">MAC</th>
              <th className="p-2 text-left">Vendor</th>
              <th className="p-2 text-left">OS</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Latency (ms)</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center">
                    Loading…
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-2">{d.ip}</td>
                    <td className="p-2">{d.hostname}</td>
                    <td className="p-2">{d.macAddress}</td>
                    <td className="p-2">{d.vendor}</td>
                    <td className="p-2">{d.operatingSystem}</td>
                    <td className="p-2">{d.status}</td>
                    <td className="p-2">{d.latency?.toFixed(1) ?? '-'} </td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => openForm(d)}
                        className="text-primary hover:text-primary/80"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        itemsPerPage={limit}
        onPageChange={setPage}
      />

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <DeviceForm
            device={editingDevice}
            onClose={closeForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
