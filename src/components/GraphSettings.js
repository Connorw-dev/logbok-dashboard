// src/components/GraphSettings.js
import React, { useState } from 'react';
import { TextField, Button, Select, MenuItem } from '@mui/material';

const GraphSettings = ({ onUpdateSettings }) => {
  const [title, setTitle] = useState('Graph Title');
  const [axisTitle, setAxisTitle] = useState('Axis Title');
  const [transformFunc, setTransformFunc] = useState('none');

  const applyChanges = () => {
    onUpdateSettings({ title, axisTitle, transformFunc });
  };

  return (
    <div>
      <TextField label="Graph Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextField label="Axis Title" value={axisTitle} onChange={(e) => setAxisTitle(e.target.value)} />
      <Select value={transformFunc} onChange={(e) => setTransformFunc(e.target.value)}>
        <MenuItem value="none">None</MenuItem>
        <MenuItem value="square">Square</MenuItem>
        <MenuItem value="sqrt">Square Root</MenuItem>
      </Select>
      <Button onClick={applyChanges}>Apply</Button>
    </div>
  );
};

export default GraphSettings;
