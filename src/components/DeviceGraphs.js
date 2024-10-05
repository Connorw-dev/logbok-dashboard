// src/components/DeviceGraphs.js
import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const DeviceGraphs = ({ data, settings }) => {
  const deviceData = data.map(item => ({
    time: item.received_at,
    temperature: item.temperature,
    light: item.light,
    voltage: item.voltage,
  }));

  const applyTransform = (value) => {
    if (settings.transformFunc === 'square') return value * value;
    if (settings.transformFunc === 'sqrt') return Math.sqrt(value);
    return value;
  };

  return (
    <LineChart width={600} height={300} data={deviceData}>
      <Line type="monotone" dataKey={(d) => applyTransform(d.temperature)} name={settings.axisTitle} stroke="#8884d8" />
      <Line type="monotone" dataKey={(d) => applyTransform(d.light)} name="Light" stroke="#82ca9d" />
      <CartesianGrid stroke="#ccc" />
      <XAxis dataKey="time" />
      <YAxis />
      <Tooltip />
      <Legend />
    </LineChart>
  );
};

export default DeviceGraphs;
