import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import SidePanel from './SidePanel'

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<SidePanel />)