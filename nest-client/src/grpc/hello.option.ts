import { ClientOptions, Transport } from "@nestjs/microservices";
import { join } from "path";


export const helloClientOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        url: 'localhost:9876',
        package: 'hello',
        protoPath: join(process.cwd(), 'src/proto/hello.proto'),
    },
};
