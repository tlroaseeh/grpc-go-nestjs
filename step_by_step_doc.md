# gRPC golang server & nestjs client

## 0. 背景介绍

这篇文章旨在介绍如何使用golang实现一个gRPC服务端，以及如何使用nestjs实现一个配置了 GraphQL endpoint 的 gRPC 客户端。

golang 作为一门静态类型语言，其类型系统非常严格，而且其编译速度非常快，所以在一些对性能要求比较高的场景下，golang 是一个非常好的选择。

nestjs 是一个基于 nodejs 的后端框架，其底层使用了 express。nestjs 本身提供了非常多的功能，例如可以使用 prisma 很方便地操作数据库，可以使用 graphql 来实现 api，可以使用 grpc 来实现微服务等等。是一门十分适合作为 API Gateway 的后端框架。

## 1. 准备工作

首先我们创建一个文件夹，用于存放我们的项目。

```bash
mkdir gRPC-go-nestjs
```

## 2. gRPC服务端

### 2.1 安装初始化go项目

这个部分我们将使用golang实现一个gRPC服务端，首先我们需要安装golang，根据自己的系统选择安装方式即可。

接下来给我们的服务端创建一个子文件夹，用于存放服务端的代码。

```bash
mkdir go-server
```

然后我们初始化一个go项目。

```bash
cd go-server
go mod init go-server
```

### 2.1 创建proto文件

接下来我们需要创建一个proto文件，用于定义我们的服务端接口。

在`go-server`文件夹下创建一个`proto`文件夹，用于存放proto文件。

我们粘贴下面的代码到`proto`文件夹下的`hello.proto`文件中。

```proto
syntax = "proto3";

option go_package = ".;hello";
package hello;

service SayHello {
    rpc SayHello (HelloRequest) returns (HelloResponse) {}
}

message HelloRequest {
    string name = 1;
}

message HelloResponse {
    string message = 1;
}
```

### 2.2 生成go代码

首先我们需要安装`protoc`，用于生成go代码。这里以macOS为例，其它系统可以`protoc`官网查看安装方式。

```bash
brew install protobuf
```

然后我们还需要安装`protoc-gen-go`和`protoc-gen-go-grpc`这两个插件，同样以macOS为例。

```bash
brew install protoc-gen-go
brew install protoc-gen-go-grpc
```

除此之外，我们还需要安装`google.golang.org/grpc`和`google.golang.org/protobuf`这两个包，作为我们生成的代码的依赖。

```bash
go get -u google.golang.org/grpc
go get -u google.golang.org/protobuf
```

我们可以用下面代码生成go代码。

```bash
protoc --go-grpc_out=./proto --go_out=./proto ./proto/hello.proto
```

为了方便，我们可以在`go-server`文件夹下创建一个`gen.sh`文件，用于生成go代码。

```bash
protoc --go-grpc_out=./proto --go_out=./proto ./proto/hello.proto
```

并执行`chmod +x gen.sh`，给`gen.sh`文件添加执行权限。

执行`./gen.sh`之后，我们可以看到`proto`文件夹下多了两个文件。


### 2.3 实现服务端

接下来我们需要实现服务端，首先我们在`go-server`文件夹下创建一个`main.go`文件。并且加入下面的代码。

```go
package main

import (
	"context"
	"fmt"
	pb "go-server/proto"
	"net"

	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedSayHelloServer
}

func (s *server) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloResponse, error) {
	return &pb.HelloResponse{Message: "Hello " + in.Name}, nil
}

func main() {

	listen, tcpErr := net.Listen("tcp", ":9876")
	if tcpErr != nil {
		fmt.Println("tcpErr: ", tcpErr)
	}

	grpcServer := grpc.NewServer()

	pb.RegisterSayHelloServer(grpcServer, &server{})
	grpcErr := grpcServer.Serve(listen)
	if grpcErr != nil {
		fmt.Println("grpcErr: ", grpcErr)
	}
}
```

在`main`函数中，我们首先创建了一个`net.Listen`，用于监听端口。然后我们创建了一个`grpc.Server`，并且注册了我们的服务。最后我们调用`grpcServer.Serve`，启动我们的服务。

除此之外，我们还实现了`SayHello`方法，用于处理客户端的请求。

这里`RegisterSayHelloServer`和`SayHello`这两个方法是我们生成的代码中的方法，我们可以在`proto/hello.pb.go`文件中找到。为了方便，我们在引用这两个方法的时候，使用了`pb`别名。

### 2.4 测试服务端

接下来我们可以测试一下我们的服务端了。这里我们使用`bloomRPC`这个工具，它是一个跨平台的gRPC客户端，可以用于测试gRPC服务端。macOS用户可以使用`brew`安装。其它系统可以在[bloomRPC的github仓库](https://github.com/bloomrpc/bloomrpc)的release页面下载对应的安装包。

```bash
brew install --cask bloomrpc
```

先启动我们的服务端。

```bash
go run main.go
```

打开`bloomRPC`，点击左上角的`+`，选择`Import File`，选择我们的`hello.proto`文件。加载成功之后，我们可以看到左侧的`SayHello`方法。点击`SayHello`，然后在右边地址栏输入我们gRPC服务端的地址`localhost:9876`，点击中间的`Play`按钮，我们可以看到下面的结果。

![img](/assets/bloomrpc_example_1.png)

表示我们的服务端已经成功启动了。

## 3. nestjs客户端

### 3.1 安装初始化nestjs项目

这个部分我们将使用nestjs实现一个gRPC客户端，首先我们需要安装nodejs，根据自己的系统选择安装方式即可。

首先返回我们的`gRPC-go-nestjs`文件夹，然后我们用`nest`脚手架创建一个nestjs项目

```bash
npm i -g @nestjs/cli
nest new nest-client
```
个人不太喜欢 `prettier` 的格式化，所以在`eslintrc.js`中将`prettier`相关的配置`'plugin:prettier/recommended',`注释掉了。

另一个比较方便的是我们可以在`tsconfig.json` 中设置 `paths`，这样我们就可以使用别名来引用我们的模块了。

```json
"paths": {
	"@/*": ["src/*"]
}
```



### 3.2 配置 GraphQL endpoint

GraphQL 是一个用于 API 的查询语言，可以很方便地获取你想要的数据，而且还能减少网络请求次数。下面以 Apollo Server 为例，介绍如何在 NestJS 中使用 GraphQL。

首先安装依赖。

```bash
yarn add @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

在`src`文件夹下创建一个`resolvers`文件夹，用于存放resolver文件。

接下来我们创建一个`hello.resolver.ts`文件，用于实现我们的resolver。

```ts
import { Args, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HelloResolver {
    constructor() { }

    @Query(() => String)
    async hello(@Args('name') name: string) {
        return `Hello ${name}`;
    }
}
```

同时在 `resolvers` 文件夹下创建一个`index.ts`文件，用于导出我们的resolver。

```ts
export * from './hello.resolver';
```

接下来我们需要在`src/app.module.ts`文件中导入我们的resolvers, 下面是完整的代码。

```ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import * as Resolvers from '@/resolvers';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      driver: ApolloDriver
    }),
  ],
  controllers: [],
  providers: [...Object.values(Resolvers)],
})
export class AppModule {}
```

配置完之后，我们就可以启动我们的项目了。

```bash
yarn start:dev
```

打开浏览器，访问`http://localhost:3000/graphql`，我们可以看到下面的页面。

![img](/assets/graphql_example_1.png)

其中，我们的query如左边所示：
```graphql
query {
  hello (name: "nest") 
}
```

这样我们的 graphql 就配置好了。

### 3.3 配置 proto 并生成代码

首先安装 nestjs 中使用 gRPC 的依赖。

```bash
yarn add -D @grpc/grpc-js @grpc/proto-loader
yarn add @nestjs/microservices
```

接下来我们需要配置 proto 文件，把上面的`hello.proto`文件复制到`nest-client`文件夹下的`proto`文件夹中。

注意在`hello.proto`文件中，我们需要把`option go_package = ".;hello";`这一行删除，因为nodejs中不需要这一行。

接下来我们需要安装 `ts-proto`，用于生成我们的代码。

```bash
yarn add -D ts-proto
```

在 `package.json` 中添加一个脚本，用于生成代码。

```json
"scripts": {
  "gen:grpc": "protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto  --ts_proto_out=./src/grpc ./src/proto/*.proto --ts_proto_opt=fileSuffix=.pb --ts_proto_opt=nestJs=true --ts_proto_opt=grpcLib=@grpc/grpc-js --ts_proto_opt=returnObservable=false --ts_proto_opt=nestJs=true --ts_proto_opt=esModuleInterop=true"
}
```

然后执行 `yarn gen:grpc`，我们可以看到 `src/grpc` 文件夹下多了一个文件，这里面就是我们生成的代码。

除此之外我们在 `src/grpc` 文件夹下创建一个 `hello.option.ts` 文件，用于配置 gRPC。

```ts
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
```

### 3.4 实现客户端

在nestjs中创建 microservice 有两种方式，一种是在模块级别配置，另一种是动态创建。这里我们使用动态创建的方式。

把 `hello.resolver.ts` 修改为下面的代码。

```ts
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
```

接下来到浏览器中访问`http://localhost:3000/graphql`，重新执行我们的query请求，我们可以看到下面的结果。

![img](/assets/grpc_response_example_1.png)

表示我们的客户端已经成功连接到了我们的服务端。