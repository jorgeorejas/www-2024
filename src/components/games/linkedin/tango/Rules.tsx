export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        Cómo se juega
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Rellena cada casilla con un sol (☀️) o una luna (🌑).</li>
        <li>Cada fila y cada columna tiene que llevar exactamente tres soles y tres lunas.</li>
        <li>No puede haber tres símbolos iguales seguidos en ninguna fila ni columna.</li>
        <li>
          Un <span className="font-mono">=</span> entre dos casillas quiere decir que son iguales;
          un <span className="font-mono">×</span>, que son distintas.
        </li>
        <li>Toca una casilla para ir cambiándola: vacía → sol → luna → vacía. Las pistas fijas no se pueden cambiar.</li>
        <li>El tablero marca en rojo los choques según juegas.</li>
      </ul>
    </details>
  );
}
