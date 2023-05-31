import { helloClientOptions } from '@/grpc/hello.option';
import { SayHelloClient } from '@/grpc/src/proto/hello.pb';
import { OnModuleInit } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Resolver()
export class HelloResolver implements OnModuleInit {
    @Client(helloClientOptions) private readonly client: ClientGrpc;

    private helloService: SayHelloClient;

    onModuleInit() {
        this.helloService = this.client.getService<SayHelloClient>('SayHello');
    }

    @Query(() => String)
    async hello(@Args('name') name: string) {
        const res = await lastValueFrom(this.helloService.sayHello({ name }));
        console.log(res);
        return `Hello ${name}`;
    }
}