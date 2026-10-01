import { HashRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import { SettingsProvider } from '../settings/SettingsProvider'
import { ProjectsPage } from '../project/ProjectsPage'
import { ProjectRoute } from '../project/ProjectRoutes.tsx'
import { PublicShareRoute } from '../share/PublicShareRoute.tsx'
import { HelpCenter } from '../help/HelpCenter.tsx'

export function App() {
  return (
    <SettingsProvider>
      <I18nProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/draw" element={<ProjectsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/p/:projectId" element={<ProjectRoute />} />
            <Route path="/s/:shareId" element={<PublicShareRoute />} />
            <Route path="/help/*" element={<HelpCenter />} />
            <Route path="*" element={<ProjectsPage />} />
          </Routes>
        </HashRouter>
      </I18nProvider>
    </SettingsProvider>
  )
}
