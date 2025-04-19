import React, { useState, useEffect } from 'react';
import { Typography, Card, CardContent, Button, Grid, Box } from '@mui/material';
import LawyerLayout from '../../components/LawyerLayout';
const dummyRequests = [ { id:1, user:'Anita Singh', desc:'Land dispute case details...', date:'2025-04-10' } ];
export default function CaseRequests(){ const [reqs,setReqs]=useState([]); useEffect(()=>setReqs(dummyRequests),[]);
  return (<LawyerLayout><Typography variant="h4">Case Requests</Typography><Grid container spacing={2} sx={{mt:2}}>{reqs.map(r=>(<Grid item xs={12} md={6} key={r.id}><Card><CardContent><Typography><b>User:</b> {r.user}</Typography><Typography><b>Date:</b> {r.date}</Typography><Typography>{r.desc}</Typography><Box sx={{mt:2}}><Button variant="contained" color="primary" sx={{mr:1}}>Accept</Button><Button variant="outlined" color="error">Reject</Button></Box></CardContent></Card></Grid>))}</Grid></LawyerLayout>);
}