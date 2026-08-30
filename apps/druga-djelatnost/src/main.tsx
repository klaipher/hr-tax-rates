import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles.css'

const container = document.getElementById('root')
if (container === null) {
  throw new Error('Кореневий елемент #root відсутній у розмітці')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
