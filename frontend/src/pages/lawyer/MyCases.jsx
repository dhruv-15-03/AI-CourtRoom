import React, { useState, useEffect } from 'react';
import { Typography, Card, CardContent, Grid } from '@mui/material';
import LawyerLayout from '../../components/LawyerLayout';
const dummyCases=[{id:1,title:'Property Dispute', outcome:'Settled', date:'2025-03-15'},{id:2,title:'Property Dispute', outcome:'Settled', date:'2025-03-15'},{id:3,title:'Property Dispute', outcome:'Settled', date:'2025-03-15'},{id:4,title:'Property Dispute', outcome:'Settled', date:'2025-03-15'},{id:5,title:'Property Dispute', outcome:'Settled', date:'2025-03-15'},{id:6,title:'Property Dispute', outcome:'Settled', date:'2025-03-15'}];
export default function MyCases(){ const [cases,setCases]=useState([]); useEffect(()=>setCases(dummyCases),[]);
  return (<LawyerLayout><Typography variant="h4">My Past Cases</Typography><Grid container spacing={2} sx={{mt:2,alignContent:'center'}}>{cases.map(c=>(<Grid item xs={12} md={4} key={c.id}><Card><CardContent><Typography><b>Title:</b> {c.title}</Typography><Typography><b>Date:</b> {c.date}</Typography><Typography><b>Outcome:</b> {c.outcome}</Typography></CardContent></Card></Grid>))}</Grid></LawyerLayout>);
}