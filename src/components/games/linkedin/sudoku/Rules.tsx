export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        Cómo se juega
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Rellena la cuadrícula de 6×6 para que cada fila, columna y caja de 2×3 tenga los números del 1 al 6 una sola vez.</li>
        <li>Toca una casilla para elegirla y pulsa un número del 1 al 6. Con Retroceso o Supr la vacías.</li>
        <li>En pantallas táctiles, vuelve a tocar la casilla elegida para sacar el teclado de números.</li>
        <li>Las casillas que ya vienen rellenas no se pueden tocar. Las que chocan se marcan en rojo.</li>
        <li>Muévete entre casillas con las flechas; dale a Pista para destapar una.</li>
      </ul>
    </details>
  );
}
