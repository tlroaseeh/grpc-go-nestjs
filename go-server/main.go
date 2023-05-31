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
