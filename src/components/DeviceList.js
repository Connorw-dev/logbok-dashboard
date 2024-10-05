// src/components/DeviceList.js
import React from 'react';
import { Grid, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const DeviceList = ({ devices }) => {
  return (
    <Grid container spacing={3}>
      {devices && devices.length > 0 ? (
        devices.map((device) => (
          <Grid item xs={12} md={6} lg={4} key={device.device_id}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <h3>{device.device_id}</h3>
              <p><strong>Temperature:</strong> {device.temperature ? `${device.temperature}°C` : 'N/A'}</p>
              <p><strong>Battery:</strong> {device.battery ? `${device.battery}V` : 'N/A'}</p>
              <p><strong>Last Received:</strong> {device.received_at ? new Date(device.received_at).toLocaleString() : 'N/A'}</p>
              <Link to={`/device/${device.device_id}`}>
                <Button variant="contained" color="primary">
                  View Details
                </Button>
              </Link>
            </Paper>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: '20px', textAlign: 'center' }}>
            <h3>No Devices Found</h3>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default DeviceList;
