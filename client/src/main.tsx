import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './ui/app'
import './ui/app.css'
import {initTheme} from "./interface/theme.store";

export function initialApp() {
  setTimeout(() => {
    initTheme()
    const node = document.getElementById('root')
    if (!node) {
      console.error('Root mode not found!')
      return
    }

    createRoot(node).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }, 0)
}
