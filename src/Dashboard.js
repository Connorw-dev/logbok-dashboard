// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Grid, Paper, Button, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDevices = () => {
    setLoading(true);
    axios.get('/api/get-sensor-records')
      .then(response => {
        if (Array.isArray(response.data)) {
          const groupedDevices = response.data.reduce((acc, current) => {
            const existingDevice = acc[current.device_id];
            if (!existingDevice || new Date(current.received_at) > new Date(existingDevice.received_at)) {
              acc[current.device_id] = current; // Keep the latest record for the device
            }
            return acc;
          }, {});
          setDevices(Object.values(groupedDevices));
        } else {
          console.error('Expected array but got:', response.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching devices', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <Box padding={3}>
      <Typography variant="h4" gutterBottom>
        Device Dashboard
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={fetchDevices}
        disabled={loading}
        style={{ marginBottom: '20px' }}
      >
        {loading ? 'Loading...' : 'Refresh Devices'}
      </Button>
      <Grid container spacing={3}>
        {devices.length > 0 ? (
          devices.map((device) => (
            <Grid item xs={12} sm={6} md={4} key={device.device_id}>
              <Paper
                elevation={3}
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {device.device_id}
                </Typography>
                <Typography variant="body1">
                  <strong>Temperature:</strong> {device.temperature ? `${device.temperature}°C` : 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Battery:</strong> {device.battery ? `${device.battery}V` : 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Last Received:</strong> {device.received_at ? new Date(device.received_at).toLocaleString() : 'N/A'}
                </Typography>
                <Link to={`/device/${device.device_id}`}>
                  <Button variant="contained" color="primary" style={{ marginTop: '20px' }}>
                    View Details
                  </Button>
                </Link>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper elevation={3} style={{ padding: '20px', textAlign: 'center' }}>
              <Typography variant="h6">No Devices Found</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
