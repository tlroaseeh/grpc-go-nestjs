/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "hello";

export interface HelloRequest {
  name: string;
}

export interface HelloResponse {
  message: string;
}

export const HELLO_PACKAGE_NAME = "hello";

export interface SayHelloClient {
  sayHello(request: HelloRequest): Observable<HelloResponse>;
}

export interface SayHelloController {
  sayHello(request: HelloRequest): Promise<HelloResponse> | Observable<HelloResponse> | HelloResponse;
}

export function SayHelloControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["sayHello"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("SayHello", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("SayHello", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const SAY_HELLO_SERVICE_NAME = "SayHello";
