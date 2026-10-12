# Saldo

Kleine webapp om je persoonlijke financiën bij te houden en vooruit te kijken.

- **Rekeningen** – voeg rekeningen toe/verwijder ze, met het huidige saldo en een *peildatum*.
- **Vaste posten** – vaste maandelijkse inkomsten en lasten (ook per kwartaal, half jaar of jaar),
  met een dag van de maand, een startmaand en optioneel een eindmaand.
- **Eenmalig** – eenmalige uitgaven of inkomsten op een datum (vakantie, nieuwe computer, bonus…).
- **Prognose** – verwacht saldo per maand voor 3 maanden tot 5 jaar vooruit, totaal of per rekening,
  met grafiek, laagste punt en per maand een uitklapbare lijst van alle posten.

Alleen posten ná de peildatum van een rekening tellen mee; werk het saldo dus af en toe bij met
de stand van je bank, dan blijft de prognose kloppen.

Gegevens worden lokaal in de browser (`localStorage`) opgeslagen. Bij een eerste bezoek toont de app
voorbeeldgegevens, die je met één klik wist. Onder *Back-up* kopieer je al je gegevens als JSON of zet je
een back-up terug (bijv. om naar een andere browser over te stappen).

## Ontwikkelen

Vue 3 + TypeScript + Vite, geen backend.

```bash
npm install
npm run dev        # ontwikkelserver op http://localhost:5173
npm test           # unit tests (vitest) voor de prognoselogica
npm run build      # typecheck + productiebuild in dist/
npm run build:single  # build + alles gebundeld in één bestand: dist/saldo.html
```

De rekenlogica staat los van de UI in `src/lib/forecast.ts` (bedragen worden intern in centen opgeteld).
