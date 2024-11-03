export default function OG(
  title: string = "<Site Name> - Default Title",
  description: string = "Default Description",
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
          fontFamily: "Rza Light, serif",
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
        By Jorge Orejas
      </p>
    </div>
  );
}
