import React, { useState, useEffect } from 'react';
import { uploadFile, getDatasets, getColumns, queryData } from './api';
import DynamicChart from './components/DynamicChart';
import { PlusCircle, Upload, BarChart3, LayoutDashboard, FileSpreadsheet } from 'lucide-react';
import './App.css';

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [columns, setColumns] = useState([]);
  const [colTypes, setColTypes] = useState({});
  const [widgets, setWidgets] = useState([]);

  // Config State
  const [config, setConfig] = useState({
    type: 'bar',
    dimension_col: '',
    measure_col: '',
    aggregation: 'sum'
  });

  useEffect(() => { loadDatasets(); }, []);

  const loadDatasets = async () => {
    try {
      const { data } = await getDatasets();
      setDatasets(data);
    } catch(err) { console.error(err); }
  };

  const handleUpload = async (e) => {
    if (!e.target.files[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    await uploadFile(formData);
    loadDatasets();
  };

  const selectDataset = async (id) => {
    setSelectedDataset(id);
    setWidgets([]);
    const { data } = await getColumns(id);
    setColumns(data.columns);
    setColTypes(data.dtypes);
  };

  const addWidget = async () => {
    // Validation: KPI needs Measure only; Charts need Measure + Dimension
    if (!config.measure_col) {
      alert("Please select a value column (Y-Axis)");
      return;
    }
    if (config.type !== 'kpi' && !config.dimension_col) {
      alert("Please select a category column (X-Axis) for this chart type.");
      return;
    }

    try {
      const payload = {
        dataset_id: selectedDataset,
        ...config,
        // Send "None" if it's a KPI card so backend knows to aggregate everything
        dimension_col: config.type === 'kpi' ? "None" : config.dimension_col 
      };

      const { data } = await queryData(payload);

      setWidgets([...widgets, { id: Date.now(), ...config, data }]);
    } catch (err) {
      alert("Failed to create widget. Check your selection.");
    }
  };

  // Helper filters
  const isNumeric = (col) => {
    const type = colTypes[col];
    return type && (type.includes('int') || type.includes('float') || type.includes('number'));
  };
  const numericColumns = columns.filter(isNumeric);

  return (
    <div className="app-container">
      {/* Sidebar (Same as before) */}
      <aside className="sidebar">
        <div className="logo"><BarChart3 size={28}/><span>PowerClone</span></div>
        <label className="upload-btn">
          <Upload size={18}/><span>Upload CSV</span>
          <input type="file" hidden onChange={handleUpload} accept=".csv"/>
        </label>
        <h3 className="section-title">My Datasets</h3>
        <ul className="dataset-list">
          {datasets.map(d => (
            <li key={d.id} onClick={() => selectDataset(d.id)} className={`dataset-item ${selectedDataset === d.id ? 'active' : ''}`}>
              <FileSpreadsheet size={16} className="inline mr-2"/>{d.filename}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {selectedDataset ? (
          <>
            {/* Toolbar */}
            <div className="toolbar">
              <div className="control-group">
                <label>Visual Type</label>
                <select className="control-select" value={config.type} onChange={e => setConfig({...config, type: e.target.value})}>
                  <option value="bar">📊 Bar Chart</option>
                  <option value="line">📈 Line Chart</option>
                  <option value="pie">🍩 Donut Chart</option>
                  <option value="kpi">🧮 KPI Card</option>
                </select>
              </div>

              {/* Hide X-Axis selector if KPI is chosen */}
              {config.type !== 'kpi' && (
                <div className="control-group">
                  <label>Category (X-Axis)</label>
                  <select className="control-select" onChange={e => setConfig({...config, dimension_col: e.target.value})}>
                    <option value="">Select...</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="control-group">
                <label>Value (Y-Axis)</label>
                <select className="control-select" onChange={e => setConfig({...config, measure_col: e.target.value})}>
                  <option value="">Select...</option>
                  {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="control-group">
                <label>Aggregation</label>
                <select className="control-select" onChange={e => setConfig({...config, aggregation: e.target.value})}>
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                  <option value="count">Count</option>
                  <option value="max">Max</option>
                </select>
              </div>

              <button onClick={addWidget} className="add-widget-btn"><PlusCircle size={18}/> Add Widget</button>
            </div>

            {/* Canvas */}
            <div className="dashboard-canvas">
              {widgets.length === 0 ? (
                 <div className="empty-state">Select options above to build your dashboard.</div>
              ) : (
                <div className="widget-grid">
                  {widgets.map(w => (
                    <div key={w.id} className="widget-card">
                      <div className="widget-header">
                        <h3 className="widget-title">
                          {w.type === 'kpi' ? w.measure_col : `${w.measure_col} by ${w.dimension_col}`}
                        </h3>
                      </div>
                      <DynamicChart type={w.type} data={w.data} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="text-center">
              <LayoutDashboard size={48} className="mx-auto mb-4 opacity-30"/>
              <h2>Welcome to PowerClone</h2>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}