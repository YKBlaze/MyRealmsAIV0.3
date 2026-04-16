import app from "./app";

const port = Number(process.env.PORT ?? 4300);

app.listen(port, () => {
  console.log(`MyRealmsAI V0.3 skeleton API listening on http://localhost:${port}`);
});
