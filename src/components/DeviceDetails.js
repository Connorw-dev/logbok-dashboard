// src/components/DeviceDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Checkbox, FormControlLabel, Grid, IconButton, Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { SketchPicker } from 'react-color';

const DeviceDetails = () => {
  const { deviceId } = useParams();
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorPickerVisible, setColorPickerVisible] = useState(null);
  const [sensorConfig, setSensorConfig] = useState({
    temperature: { name: 'Temperature', factor: 'x', selected: true, color: '#8884d8' },
    battery: { name: 'Battery', factor: 'x', selected: true, color: '#82ca9d' },
    sdi12_1: { name: 'SDI12-1', factor: 'x', selected: true, color: '#ff7300' },
    sdi12_2: { name: 'SDI12-2', factor: 'x', selected: true, color: '#00c49f' },
    modbus_1: { name: 'Modbus-1', factor: 'x', selected: true, color: '#ffbb28' },
    modbus_2: { name: 'Modbus-2', factor: 'x', selected: true, color: '#ff8042' },
    analog_1: { name: 'Analog-1', factor: 'x', selected: true, color: '#0088FE' }
  });

  useEffect(() => {
    axios.get('/api/get-sensor-records')
      .then((response) => {
        const allRecords = response.data;
        const filteredRecords = allRecords.filter(record => record.device_id === deviceId);
        const sortedRecords = filteredRecords.sort((a, b) => new Date(a.received_at) - new Date(b.received_at));
        setDeviceData(sortedRecords);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching device records:', error);
        setLoading(false);
      });
  }, [deviceId]);

  const handleFactorChange = (sensor, factor) => {
    setSensorConfig(prevConfig => ({
      ...prevConfig,
      [sensor]: {
        ...prevConfig[sensor],
        factor
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
    setColorPickerVisible(null);  // Close the color picker after color selection
  };

  const applyTransform = (value, factor) => {
    try {
      const x = value;
      return eval(factor); // Use a math parser for better safety in production
    } catch (e) {
      return value;
    }
  };

  const formatTime = (timeString) => format(new Date(timeString), 'yyyy-MM-dd HH:mm:ss');

  const combinedData = deviceData.map(record => {
    const combined = { ...record };
    Object.keys(sensorConfig).forEach(sensorKey => {
      if (sensorConfig[sensorKey].selected) {
        combined[sensorKey] = applyTransform(record[sensorKey], sensorConfig[sensorKey].factor);
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
      <Link to="/">
        <Button variant="contained" color="primary" style={{ marginBottom: '20px' }}>
          Back to Dashboard
        </Button>
      </Link>

      {/* Centered Table with Fixed Max Width */}
      <TableContainer
        component={Paper}
        style={{
          marginBottom: '30px',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '1000px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Table aria-label="sensor table">
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="h6">Sensor</Typography></TableCell>
              <TableCell><Typography variant="h6">Name</Typography></TableCell>
              <TableCell><Typography variant="h6">Factor (e.g., x^2 + 3)</Typography></TableCell>
              <TableCell><Typography variant="h6">Color</Typography></TableCell>
              <TableCell><Typography variant="h6">Include in Combined Graph</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(sensorConfig).map((sensorKey) => (
              <TableRow key={sensorKey}>
                <TableCell>{sensorKey.replace('_', '-')}</TableCell>
                <TableCell>
                  <TextField
                    value={sensorConfig[sensorKey].name}
                    onChange={(e) => handleNameChange(sensorKey, e.target.value)}
                    label="Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={sensorConfig[sensorKey].factor}
                    onChange={(e) => handleFactorChange(sensorKey, e.target.value)}
                    label="Factor"
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  {/* Color picker */}
                  <IconButton onClick={() => setColorPickerVisible(sensorKey)}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: sensorConfig[sensorKey].color,
                        borderRadius: '50%',
                        border: '1px solid #ccc',
                      }}
                    />
                  </IconButton>
                  {colorPickerVisible === sensorKey && (
                    <SketchPicker
                      color={sensorConfig[sensorKey].color}
                      onChangeComplete={(color) => handleColorChange(sensorKey, color)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={<Checkbox checked={sensorConfig[sensorKey].selected} onChange={() => handleCheckboxChange(sensorKey)} />}
                    label="Select"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Combined Graph */}
      <Box mb={3} p={2} style={{ borderRadius: '8px', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Combined Graph
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
            {Object.keys(sensorConfig).map(sensorKey => (
              sensorConfig[sensorKey].selected && (
                <Line
                  key={sensorKey}
                  type="monotone"
                  dataKey={sensorKey}
                  name={sensorConfig[sensorKey].name}
                  stroke={sensorConfig[sensorKey].color}
                  strokeWidth={3}
                />
              )
            ))}
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="received_at" tickFormatter={formatTime} />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Individual Graphs with Two-Column Layout */}
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
                    dataKey={(d) => applyTransform(d[sensorKey], sensorConfig[sensorKey].factor)}
                    name={sensorConfig[sensorKey].name}
                    stroke={sensorConfig[sensorKey].color}
                    strokeWidth={3}
                  />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="received_at" tickFormatter={formatTime} />
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
