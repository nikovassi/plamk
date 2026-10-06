import { useRoutes } from 'react-router'
import { routeConfig } from './routes'

export function App() {
  return useRoutes(routeConfig)
}
