import type { NextConfig } from 'next'
import { BASE_PATH } from './src/lib/config'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  images: { unoptimized: true },
  trailingSlash: true,
}

/**
 * Omdirigering som bare finnes under `next dev`.
 *
 * Med basePath satt svarer utviklingsserveren 404 på rota (http://localhost:4000/)
 * — men det er nettopp den adressen Next skriver ut i terminalen ved
 * oppstart, uten prefikset. Den naturlige lenka å klikke er altså den som
 * ikke virker, og Next sin egen 404-side er helsvart i mørk modus.
 *
 * Nøkkelen settes HELT utenfor produksjonsbygget. Å la den stå med tom liste
 * er ikke nok: Next advarer om at «redirects» ikke virker med
 * `output: export` så lenge nøkkelen i det hele tatt finnes, og en advarsel
 * ved hvert bygg er verre enn ingen advarsel — man slutter å lese dem.
 *
 * I produksjon trengs den ikke uansett: på GitHub Pages ligger appen under
 * /handleliste/, og domenerota tilhører ikke oss.
 */
if (process.env.NODE_ENV === 'development') {
  nextConfig.redirects = async () => [
    {
      source: '/',
      destination: `${BASE_PATH}/`,
      permanent: false,
      // Uten dette ville basePath blitt lagt på source, slik at regelen
      // matchet /handleliste/ i stedet for rota vi faktisk vil fange.
      basePath: false,
    },
  ]
}

export default nextConfig
