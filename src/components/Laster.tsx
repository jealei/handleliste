import stiler from './Laster.module.css'

/**
 * Vises mens vi venter på å få lest låst-tilstanden fra localStorage.
 *
 * Grunnen til at dette finnes i det hele tatt: statisk eksport bygger HTML-en
 * uten localStorage, så sida kan ikke vite om brukeren er logget inn før
 * første effekt har kjørt. Tidligere rendret vi `null` i mellomtida — men da
 * blir den ferdigbygde HTML-en helt tom, og hvis JavaScript av en eller annen
 * grunn ikke kjører, står brukeren igjen med en svart skjerm uten et eneste
 * hint om hva som er galt. Nå står det i det minste noe der.
 */
export function Laster() {
  return (
    <main className={stiler.skjerm} role="status" aria-live="polite">
      <p className={stiler.tittel}>Handleliste</p>
      <p className={stiler.tekst}>Laster …</p>
    </main>
  )
}
