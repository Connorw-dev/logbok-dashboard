import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Checkbox, FormControlLabel, Grid, Box, Typography, Menu, MenuItem, Tooltip as MuiTooltip, IconButton } from '@mui/material'; // Added IconButton
import { SketchPicker } from 'react-color';
import { Parser } from 'json2csv';
import { evaluate } from 'mathjs';

const DeviceDetails = () => {
  const { deviceId } = useParams();
  const [deviceData, setDeviceData] = useState([]);
  const [modbusConfig, setModbusConfig] = useState({
    modbus_1: { slaveAddress: '', startingAddress: '', numRegisters: '', dataBits: '', stopBits: '', parity: 'None', baudrate: '' },
    modbus_2: { slaveAddress: '', startingAddress: '', numRegisters: '', dataBits: '', stopBits: '', parity: 'None', baudrate: '' },
  });
  const [colorPickerVisible, setColorPickerVisible] = useState(null);
  const [sensorConfig, setSensorConfig] = useState({
    temperature: { name: 'Temperature', function: 'x', selected: true, color: '#8884d8' },
    battery: { name: 'Battery', function: 'x', selected: true, color: '#82ca9d' },
    sdi12_1: { name: 'SDI12-1', function: 'x', selected: true, color: '#ff7300' },
    sdi12_2: { name: 'SDI12-2', function: 'x', selected: true, color: '#00c49f' },
    modbus_1: { name: 'Modbus-1', function: 'x', selected: true, color: '#ffbb28' },
    modbus_2: { name: 'Modbus-2', function: 'x', selected: true, color: '#ff8042' },
    analog_1: { name: 'Analog-1', function: 'x', selected: true, color: '#0088FE' }
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const pickerRef = useRef();

  useEffect(() => {
    axios.get('/api/get-sensor-records')
      .then((response) => {
        const allRecords = response.data;
        const filteredRecords = allRecords.filter(record => record.device_id === deviceId);
        const sortedRecords = filteredRecords.sort((a, b) => new Date(a.received_at) - new Date(b.received_at));
        setDeviceData(sortedRecords);
      })
      .catch((error) => {
        console.error('Error fetching device records:', error);
      });
    
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setColorPickerVisible(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [deviceId]);

  // Handling MODBUS configuration input changes
  const handleModbusChange = (modbus, field, value) => {
    setModbusConfig(prevConfig => ({
      ...prevConfig,
      [modbus]: {
        ...prevConfig[modbus],
        [field]: value
      }
    }));
  };

  const handleModbusSubmit = (modbus) => {
    axios.post(`/api/update-modbus-config`, { deviceId, ...modbusConfig[modbus] })
      .then(() => alert(`${modbus} Configuration Updated`))
      .catch(err => console.error(`Failed to update ${modbus} configuration:`, err));
  };

  // Sensor configuration logic
  const handleFunctionChange = (sensor, func) => {
    setSensorConfig(prevConfig => ({
      ...prevConfig,
      [sensor]: {
        ...prevConfig[sensor],
        function: func
      }
    }));
  };

  const handleNameChange = (sensor, name) => {
    setSensorConfig(prevConfig => ({
      ...prevConfig,
      [sensor]: {
        ...prevConfig[sensor],
        name
      }
    }));
  };

  const handleCheckboxChange = (sensor) => {
    setSensorConfig(prevConfig => ({
      ...prevConfig,
      [sensor]: {
        ...prevConfig[sensor],
        selected: !prevConfig[sensor].selected
      }
    }));
  };

  const handleColorChange = (sensor, color) => {
    setSensorConfig(prevConfig => ({
      ...prevConfig,
      [sensor]: {
        ...prevConfig[sensor],
        color: color.hex
      }
    }));
    setColorPickerVisible(null);
  };

  const toggleColorPicker = (sensor) => {
    setColorPickerVisible(prev => prev === sensor ? null : sensor);
  };

  const applyTransform = (value, func) => {
    try {
      return evaluate(func, { x: value });
    } catch (e) {
      console.error('Error in expression:', e);
      return value;
    }
  };

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  // Remove all data
  const handleRemoveData = () => {
    if (window.confirm('Are you sure you want to delete all data for this device?')) {
      axios.delete(`/api/delete-sensor-record/${deviceId}`)
        .then(() => alert('Data deleted successfully'))
        .catch(err => console.error('Failed to delete data:', err));
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csvFields = ['device_id', 'received_at', ...Object.keys(sensorConfig)];
    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(deviceData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${deviceId}_sensor_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle sampling frequency change
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleFrequencyChange = (frequency) => {
    if (window.confirm(`Are you sure you want to change the sampling frequency to ${frequency} seconds?`)) {
      axios.post(`/api/change-frequency`, { deviceId, frequency })
        .then(() => alert('Frequency updated successfully'))
        .catch(err => console.error('Failed to change frequency:', err));
    }
    setAnchorEl(null);
  };

  const combinedData = deviceData.map(record => {
    const combined = { ...record };
    Object.keys(sensorConfig).forEach(sensorKey => {
      if (sensorConfig[sensorKey].selected) {
        combined[sensorKey] = applyTransform(record[sensorKey], sensorConfig[sensorKey].function);
      } else {
        combined[sensorKey] = null;
      }
    });
    return combined;
  });

  return (
    <Box padding={3}>
      <Typography variant="h4" gutterBottom>
        {deviceId} - Sensor Data
      </Typography>

      {/* Add the old features back: Download CSV, Remove Data, and Change Frequency */}
      <Box display="flex" alignItems="center" mb={3}>
        <Link to="/">
          <Button variant="contained" color="primary" style={{ marginRight: '10px' }}>
            Back to Dashboard
          </Button>
        </Link>
        <Button variant="contained" color="secondary" onClick={handleDownloadCSV} style={{ marginRight: '10px' }}>
          Download CSV
        </Button>
        <Button variant="contained" color="error" onClick={handleRemoveData} style={{ marginRight: '10px' }}>
          Remove Data
        </Button>

        <Button variant="contained" onClick={handleOpenMenu}>
          Change Frequency
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem onClick={() => handleFrequencyChange(5)}>5 seconds</MenuItem>
          <MenuItem onClick={() => handleFrequencyChange(30)}>30 seconds</MenuItem>
          <MenuItem onClick={() => handleFrequencyChange(300)}>5 minutes</MenuItem>
        </Menu>
      </Box>

      {/* Sensor Configuration Table with MODBUS Inputs */}
      <TableContainer component={Paper} style={{ marginBottom: '30px', padding: '20px', borderRadius: '8px', width: '100%', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <Table aria-label="sensor table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '15%' }}><Typography variant="h6">Sensor</Typography></TableCell>
              <TableCell style={{ width: '20%' }}><Typography variant="h6">Name</Typography></TableCell>
              <TableCell style={{ whiteSpace: 'nowrap', width: '25%' }}><Typography variant="h6">Function (e.g., x^2 + 3)</Typography></TableCell>
              <TableCell style={{ width: '10%' }}><Typography variant="h6">Colour</Typography></TableCell>
              <TableCell style={{ width: '15%' }}><Typography variant="h6">Include in Combined Graph</Typography></TableCell>
              <TableCell style={{ width: '15%' }}><Typography variant="h6">MODBUS Config</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(sensorConfig).map((sensorKey) => (
              <TableRow key={sensorKey} style={{ borderBottom: '1px solid lightgrey' }}>
                <TableCell>{sensorKey.replace('_', '-')}</TableCell>
                <TableCell>
                  <TextField value={sensorConfig[sensorKey].name} onChange={(e) => handleNameChange(sensorKey, e.target.value)} label="Name" variant="outlined" size="small" fullWidth />
                </TableCell>
                <TableCell>
                  <TextField value={sensorConfig[sensorKey].function} onChange={(e) => handleFunctionChange(sensorKey, e.target.value)} label="Function" variant="outlined" size="small" fullWidth />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => toggleColorPicker(sensorKey)}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: sensorConfig[sensorKey].color, borderRadius: '50%', border: '1px solid #ccc' }} />
                  </IconButton>
                  {colorPickerVisible === sensorKey && (
                    <div ref={pickerRef}>
                      <SketchPicker color={sensorConfig[sensorKey].color} onChangeComplete={(color) => handleColorChange(sensorKey, color)} />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <FormControlLabel control={<Checkbox checked={sensorConfig[sensorKey].selected} onChange={() => handleCheckboxChange(sensorKey)} />} label="Select" />
                </TableCell>

                {/* Add MODBUS Configuration Inputs for modbus_1 and modbus_2 */}
                {sensorKey.startsWith('modbus') && (
                  <TableCell>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <MuiTooltip title="The unique address assigned to each device on the MODBUS network." arrow>
                          <TextField
                            label="Slave Address"
                            value={modbusConfig[sensorKey].slaveAddress}
                            onChange={(e) => handleModbusChange(sensorKey, 'slaveAddress', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12}>
                        <MuiTooltip title="The starting register address for the data being requested." arrow>
                          <TextField
                            label="Starting Address"
                            value={modbusConfig[sensorKey].startingAddress}
                            onChange={(e) => handleModbusChange(sensorKey, 'startingAddress', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12}>
                        <MuiTooltip title="Number of registers to be read." arrow>
                          <TextField
                            label="Number of Registers"
                            value={modbusConfig[sensorKey].numRegisters}
                            onChange={(e) => handleModbusChange(sensorKey, 'numRegisters', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12}>
                        <MuiTooltip title="The number of data bits used in each frame." arrow>
                          <TextField
                            label="Data Bits"
                            value={modbusConfig[sensorKey].dataBits}
                            onChange={(e) => handleModbusChange(sensorKey, 'dataBits', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12}>
                        <MuiTooltip title="The number of stop bits used for framing." arrow>
                          <TextField
                            label="Stop Bits"
                            value={modbusConfig[sensorKey].stopBits}
                            onChange={(e) => handleModbusChange(sensorKey, 'stopBits', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12}>
                        <MuiTooltip title="The parity bit setting, used for error checking. Options: None, Even, Odd." arrow>
                          <TextField
                            label="Parity"
                            value={modbusConfig[sensorKey].parity}
                            onChange={(e) => handleModbusChange(sensorKey, 'parity', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12}>
                        <MuiTooltip title="The communication speed (baudrate) for the MODBUS device." arrow>
                          <TextField
                            label="Baudrate"
                            value={modbusConfig[sensorKey].baudrate}
                            onChange={(e) => handleModbusChange(sensorKey, 'baudrate', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </MuiTooltip>
                      </Grid>
                      <Grid item xs={12} style={{ textAlign: 'center' }}>
                        <Button variant="contained" color="secondary" onClick={() => handleModbusSubmit(sensorKey)} size="small">
                          Update {sensorConfig[sensorKey].name} Config
                        </Button>
                      </Grid>
                    </Grid>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Combined Graph Section */}
      <Box mb={3} p={2} style={{ borderRadius: '8px', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Combined Graph
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
            {Object.keys(sensorConfig).map(sensorKey => (
              sensorConfig[sensorKey].selected && (
                <Line key={sensorKey} type="monotone" dataKey={sensorKey} name={sensorConfig[sensorKey].name} stroke={sensorConfig[sensorKey].color} strokeWidth={3} />
              )
            ))}
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="received_at" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Individual Sensor Graphs */}
      <Grid container spacing={3} justifyContent="center">
        {Object.keys(sensorConfig).map(sensorKey => (
          <Grid item xs={12} sm={6} key={sensorKey}>
            <Box p={2} style={{ borderRadius: '8px', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {sensorConfig[sensorKey].name}
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={deviceData}>
                  <Line
                    type="monotone"
                    dataKey={(d) => applyTransform(d[sensorKey], sensorConfig[sensorKey].function)}
                    name={sensorConfig[sensorKey].name}
                    stroke={sensorConfig[sensorKey].color}
                    strokeWidth={3}
                  />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="received_at" tickFormatter={formatXAxis} />
                  <YAxis />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DeviceDetails;
