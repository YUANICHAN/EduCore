import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Building2, DoorOpen, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Sidebar from '../../Components/Admin/Sidebar.jsx';
import roomService from '../../service/roomService';
import buildingService from '../../service/buildingService';

function compareRooms(a, b) {
  const aBuilding = String(a?.building_record?.name || a?.building || '');
  const bBuilding = String(b?.building_record?.name || b?.building || '');
  const buildingDiff = aBuilding.localeCompare(bBuilding, undefined, { sensitivity: 'base' });
  if (buildingDiff !== 0) return buildingDiff;

  const aRoom = String(a?.room_number || '');
  const bRoom = String(b?.room_number || '');
  return aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: 'base' });
}

function Room() {
  const [activeItem, setActiveItem] = useState('Rooms');

  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [buildingLoading, setBuildingLoading] = useState(true);
  const [error, setError] = useState('');

  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [buildingStatusFilter, setBuildingStatusFilter] = useState('all');

  const [roomPage, setRoomPage] = useState(1);
  const [roomPerPage, setRoomPerPage] = useState(10);
  const [roomTotal, setRoomTotal] = useState(0);
  const [roomLastPage, setRoomLastPage] = useState(1);

  const [buildingPage, setBuildingPage] = useState(1);
  const [buildingPerPage, setBuildingPerPage] = useState(10);
  const [buildingTotal, setBuildingTotal] = useState(0);
  const [buildingLastPage, setBuildingLastPage] = useState(1);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [savingBuilding, setSavingBuilding] = useState(false);

  const [roomForm, setRoomForm] = useState({
    building_id: '',
    room_number: '',
    status: 'active',
  });

  const [buildingForm, setBuildingForm] = useState({
    name: '',
    status: 'active',
  });

  const fetchRooms = useCallback(async () => {
    setRoomLoading(true);
    setError('');

    try {
      const params = {
        page: roomPage,
        per_page: roomPerPage,
        sort_by: 'building',
        sort_order: 'asc',
      };

      const term = roomSearch.trim();
      if (term) params.search = term;
      if (roomStatusFilter !== 'all') params.status = roomStatusFilter;

      const res = await roomService.getAll(params);
      setRooms(Array.isArray(res?.data) ? res.data : []);
      setRoomTotal(Number(res?.total || 0));
      setRoomLastPage(Math.max(1, Number(res?.last_page || 1)));
    } catch (err) {
      setRooms([]);
      setRoomTotal(0);
      setRoomLastPage(1);
      setError(err?.response?.data?.message || err.message || 'Failed to load rooms');
    } finally {
      setRoomLoading(false);
    }
  }, [roomPage, roomPerPage, roomSearch, roomStatusFilter]);

  const fetchBuildings = useCallback(async () => {
    setBuildingLoading(true);
    setError('');

    try {
      const params = {
        page: buildingPage,
        per_page: buildingPerPage,
        sort_by: 'name',
        sort_order: 'asc',
      };

      const term = buildingSearch.trim();
      if (term) params.search = term;
      if (buildingStatusFilter !== 'all') params.status = buildingStatusFilter;

      const res = await buildingService.getAll(params);
      setBuildings(Array.isArray(res?.data) ? res.data : []);
      setBuildingTotal(Number(res?.total || 0));
      setBuildingLastPage(Math.max(1, Number(res?.last_page || 1)));
    } catch (err) {
      setBuildings([]);
      setBuildingTotal(0);
      setBuildingLastPage(1);
      setError(err?.response?.data?.message || err.message || 'Failed to load buildings');
    } finally {
      setBuildingLoading(false);
    }
  }, [buildingPage, buildingPerPage, buildingSearch, buildingStatusFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    if (roomPage > roomLastPage) setRoomPage(roomLastPage);
  }, [roomPage, roomLastPage]);

  useEffect(() => {
    if (buildingPage > buildingLastPage) setBuildingPage(buildingLastPage);
  }, [buildingPage, buildingLastPage]);

  const roomPageStart = roomTotal === 0 ? 0 : ((roomPage - 1) * roomPerPage) + 1;
  const roomPageEnd = roomTotal === 0 ? 0 : Math.min(roomPage * roomPerPage, roomTotal);
  const buildingPageStart = buildingTotal === 0 ? 0 : ((buildingPage - 1) * buildingPerPage) + 1;
  const buildingPageEnd = buildingTotal === 0 ? 0 : Math.min(buildingPage * buildingPerPage, buildingTotal);

  const roomStats = useMemo(() => ({
    totalRooms: roomTotal,
    totalBuildings: buildingTotal,
  }), [roomTotal, buildingTotal]);

  const buildingStats = useMemo(() => ({
    totalBuildings: buildingTotal,
    activeBuildings: buildings.filter((building) => building.status === 'active').length,
  }), [buildingTotal, buildings]);

  const sortedRooms = useMemo(() => [...rooms].sort(compareRooms), [rooms]);

  const resetRoomForm = () => {
    setEditingRoom(null);
    setRoomForm({ building_id: '', room_number: '', status: 'active' });
  };

  const resetBuildingForm = () => {
    setEditingBuilding(null);
    setBuildingForm({ name: '', status: 'active' });
  };

  const openRoomModal = () => {
    resetRoomForm();
    setShowRoomModal(true);
  };

  const openRoomEditModal = (room) => {
    setEditingRoom(room);
    setRoomForm({
      building_id: room.building_id || room.building_record?.id || '',
      room_number: room.room_number || '',
      status: room.status || 'active',
    });
    setShowRoomModal(true);
  };

  const openBuildingModal = () => {
    resetBuildingForm();
    setShowBuildingModal(true);
  };

  const openBuildingEditModal = (building) => {
    setEditingBuilding(building);
    setBuildingForm({
      name: building.name || '',
      status: building.status || 'active',
    });
    setShowBuildingModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    resetRoomForm();
  };

  const closeBuildingModal = () => {
    setShowBuildingModal(false);
    resetBuildingForm();
  };

  const handleRoomSave = async () => {
    if (!roomForm.building_id || !roomForm.room_number.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please select a building and enter a room number.',
      });
      return;
    }

    setSavingRoom(true);
    try {
      const payload = {
        building_id: Number(roomForm.building_id),
        room_number: roomForm.room_number.trim(),
        status: roomForm.status,
      };

      if (editingRoom) {
        await roomService.update(editingRoom.id, payload);
      } else {
        await roomService.create(payload);
      }

      await fetchRooms();
      closeRoomModal();
      await Swal.fire({
        icon: 'success',
        title: editingRoom ? 'Room updated' : 'Room created',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Save failed',
        text: err?.response?.data?.message || err.message || 'Unable to save room.',
      });
    } finally {
      setSavingRoom(false);
    }
  };

  const handleBuildingSave = async () => {
    if (!buildingForm.name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Building name is required.',
      });
      return;
    }

    setSavingBuilding(true);
    try {
      const payload = {
        name: buildingForm.name.trim(),
        status: buildingForm.status,
      };

      if (editingBuilding) {
        await buildingService.update(editingBuilding.id, payload);
      } else {
        await buildingService.create(payload);
      }

      await fetchBuildings();
      await fetchRooms();
      closeBuildingModal();
      await Swal.fire({
        icon: 'success',
        title: editingBuilding ? 'Building updated' : 'Building created',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Save failed',
        text: err?.response?.data?.message || err.message || 'Unable to save building.',
      });
    } finally {
      setSavingBuilding(false);
    }
  };

  const handleRoomDelete = async (room) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Delete room ${room.room_number}?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await roomService.delete(room.id);
      await fetchRooms();
      await Swal.fire({
        icon: 'success',
        title: 'Room deleted',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: err?.response?.data?.message || err.message || 'Unable to delete room.',
      });
    }
  };

  const handleBuildingDelete = async (building) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Delete building ${building.name}?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await buildingService.delete(building.id);
      await fetchBuildings();
      await fetchRooms();
      await Swal.fire({
        icon: 'success',
        title: 'Building deleted',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: err?.response?.data?.message || err.message || 'Unable to delete building.',
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
          <div className="px-6 py-5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rooms & Buildings</h1>
            <p className="mt-1 text-sm text-slate-600">Manage buildings on the right and rooms on the left.</p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Rooms</h2>
                  <p className="text-xs text-slate-500">Each room must belong to a building.</p>
                </div>
                <button
                  type="button"
                  onClick={openRoomModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Room
                </button>
              </div>

              <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={roomSearch}
                    onChange={(e) => {
                      setRoomSearch(e.target.value);
                      setRoomPage(1);
                    }}
                    placeholder="Search room or building"
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={roomStatusFilter}
                  onChange={(e) => {
                    setRoomStatusFilter(e.target.value);
                    setRoomPage(1);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                Showing {roomPageStart}-{roomPageEnd} of {roomTotal}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Building</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Room</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roomLoading ? (
                      <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={4}><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />Loading rooms...</td></tr>
                    ) : rooms.length === 0 ? (
                      <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={4}>No rooms found.</td></tr>
                    ) : sortedRooms.map((room) => (
                      <tr key={room.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4 text-slate-700">
                          <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                            <Building2 className="h-4 w-4 text-slate-500" />
                            {room.building_record?.name || room.building || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                            <DoorOpen className="h-4 w-4 text-slate-500" />
                            {room.room_number}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${room.status === 'inactive' ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                            {room.status || 'active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button type="button" onClick={() => openRoomEditModal(room)} className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button>
                            <button type="button" onClick={() => handleRoomDelete(room)} className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Rows per page</span>
                  <select
                    value={roomPerPage}
                    onChange={(e) => {
                      setRoomPerPage(Number(e.target.value));
                      setRoomPage(1);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500"
                  >
                    {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setRoomPage((prev) => Math.max(1, prev - 1))} disabled={roomPage <= 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                  <span className="text-sm text-slate-600">Page {roomPage} of {roomLastPage}</span>
                  <button type="button" onClick={() => setRoomPage((prev) => Math.min(roomLastPage, prev + 1))} disabled={roomPage >= roomLastPage} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Buildings</h2>
                  <p className="text-xs text-slate-500">Manage building records that rooms belong to.</p>
                </div>
                <button
                  type="button"
                  onClick={openBuildingModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Building
                </button>
              </div>

              <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={buildingSearch}
                    onChange={(e) => {
                      setBuildingSearch(e.target.value);
                      setBuildingPage(1);
                    }}
                    placeholder="Search building"
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={buildingStatusFilter}
                  onChange={(e) => {
                    setBuildingStatusFilter(e.target.value);
                    setBuildingPage(1);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                Showing {buildingPageStart}-{buildingPageEnd} of {buildingTotal}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Building</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buildingLoading ? (
                      <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={3}><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />Loading buildings...</td></tr>
                    ) : buildings.length === 0 ? (
                      <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={3}>No buildings found.</td></tr>
                    ) : buildings.map((building) => (
                      <tr key={building.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4 text-slate-700">
                          <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                            <Building2 className="h-4 w-4 text-slate-500" />
                            {building.name}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${building.status === 'inactive' ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                            {building.status || 'active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button type="button" onClick={() => openBuildingEditModal(building)} className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button>
                            <button type="button" onClick={() => handleBuildingDelete(building)} className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Rows per page</span>
                  <select
                    value={buildingPerPage}
                    onChange={(e) => {
                      setBuildingPerPage(Number(e.target.value));
                      setBuildingPage(1);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500"
                  >
                    {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setBuildingPage((prev) => Math.max(1, prev - 1))} disabled={buildingPage <= 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                  <span className="text-sm text-slate-600">Page {buildingPage} of {buildingLastPage}</span>
                  <button type="button" onClick={() => setBuildingPage((prev) => Math.min(buildingLastPage, prev + 1))} disabled={buildingPage >= buildingLastPage} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {showRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Select the building first, then assign the room number.</p>
                </div>
                <button type="button" onClick={closeRoomModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Building</label>
                  <select
                    value={roomForm.building_id}
                    onChange={(e) => setRoomForm((prev) => ({ ...prev, building_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Room</label>
                  <input
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm((prev) => ({ ...prev, room_number: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Room 101"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Status</label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={closeRoomModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="button" onClick={handleRoomSave} disabled={savingRoom} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {savingRoom && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingRoom ? 'Save Changes' : 'Create Room'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBuildingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{editingBuilding ? 'Edit Building' : 'Add Building'}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Create a building before assigning rooms to it.</p>
                </div>
                <button type="button" onClick={closeBuildingModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Building Name</label>
                  <input
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Main Campus"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">Status</label>
                  <select
                    value={buildingForm.status}
                    onChange={(e) => setBuildingForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={closeBuildingModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="button" onClick={handleBuildingSave} disabled={savingBuilding} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {savingBuilding && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingBuilding ? 'Save Changes' : 'Create Building'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Room;
