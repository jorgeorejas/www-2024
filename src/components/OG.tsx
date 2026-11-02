import { SITE } from "@consts";

export default function OG(
  title: string = SITE.NAME,
  description: string = "",
) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#fff",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <h1
        style={{
          display: "flex",
          flexDirection: "column",
          color: "black",
          fontSize: "3rem",
          width: "100%",
          fontWeight: "bold",
          fontFamily: "Instrument Serif, serif",
          overflow: "hidden",
          padding: "2rem 4rem",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          display: "flex",
          flexDirection: "column",
          color: "black",
          fontSize: "1.5rem",
          width: "100%",
          fontWeight: "bold",
          fontFamily: "IBM Plex Mono, monospace",
          overflow: "hidden",
          padding: "2rem 4rem",
        }}
      >
        {description}
      </p>
      <p
        style={{
          display: "flex",
          flexDirection: "column",
          color: "black",
          fontSize: "1.5rem",
          width: "100%",
          fontWeight: "bold",
          fontFamily: "IBM Plex Mono, monospace",
          overflow: "hidden",
          padding: "2rem 4rem",
        }}
      >
        Por {SITE.NAME}
      </p>
    </div>
  );
}
