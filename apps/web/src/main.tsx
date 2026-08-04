import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { I18nProvider } from './i18n/context.tsx'
import './styles.css'

const container = document.getElementById('root')
if (container === null) {
  throw new Error('Кореневий елемент #root відсутній у розмітці')
}

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
