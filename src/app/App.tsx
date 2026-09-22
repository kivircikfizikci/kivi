import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import { SettingsProvider } from '../settings/SettingsProvider'
import { ProjectsPage } from '../project/ProjectsPage'
import { HomeProjectRoute, ProjectRoute } from '../project/ProjectRoutes.tsx'

export function App() {
  return (
    <SettingsProvider>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeProjectRoute />} />
            <Route path="/draw" element={<HomeProjectRoute />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/p/:projectId" element={<ProjectRoute />} />
            <Route path="*" element={<HomeProjectRoute />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </SettingsProvider>
  )
}
