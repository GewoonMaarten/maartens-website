provider "aws" {
    version = "~> 2.0"
    region  = "eu-central-1"
}

resource "aws_lambda_layer_version" "hugo" {
    filename    = "./layers/hugo_0.55.6.zip"
    layer_name  = "hugo_0.55.6"

    compatible_runtimes = [ "python3.7" ]
}

resource "aws_lambda_layer_version" "libstdc" {
    filename    = "./layers/libstdc.zip"
    layer_name  = "libstdc"
    
    compatible_runtimes = [ "python3.7" ]
}

resource "aws_lambda_layer_version" "aws_cli" {
    filename    = "./layers/aws_cli.zip"
    layer_name  = "aws_cli"
    
    compatible_runtimes = [ "python3.7" ]
}