import { env } from "./config/env";
import { createServer } from "./infrastructure/http/server";

function bootstrap(): void {
  const app = createServer();

  app.listen(env.PORT, () => {
    console.log(`AI Gateway listening on port ${env.PORT}`);
  });
}

bootstrap();
