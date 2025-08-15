import { useSolitaire } from "./provider";

export default function Hint() {
  const { getHint } = useSolitaire();

  const hint = getHint();

  return (
    <div>
      <pre>{JSON.stringify(hint, null, 2)}</pre>
    </div>
  );
}
