provider "aws" {
    version = "~> 2.0"
    region  = "eu-central-1"
}

resource "aws_lambda_layer_version" "hugo" {
    filename    = "./lambda/layers/hugo_0.55.6.zip"
    layer_name  = "hugo_0.55.6"

    compatible_runtimes = [ "python3.7" ]
}

resource "aws_lambda_layer_version" "libstdc" {
    filename    = "./lambda/layers/libstdc.zip"
    layer_name  = "libstdc"
    
    compatible_runtimes = [ "python3.7" ]
}

resource "aws_lambda_layer_version" "aws_cli" {
    filename    = "./lambda/layers/aws_cli.zip"
    layer_name  = "aws_cli"
    
    compatible_runtimes = [ "python3.7" ]
}

resource "aws_s3_bucket" "hugo_source_bucket" {
    bucket = "hugo_source_bucket"
    acl = "private"
}

resource "aws_s3_bucket" "hugo_site_bucket" {
    bucket  = "hugo_site_bucket"
    acl     = "public-read"
    policy  = <<EOF
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::${aws_s3_bucket.hugo_site_bucket.bucket}/*"
            }
        ]
    }
    EOF

    website {
        index_document = "index.html"
        error_document = "404.html"
    }
}

resource "aws_iam_role" "iam_for_lambda" {
    name = "iam_for_lambda"

    assume_role_policy = <<EOF
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                "Resource": [
                    "arn:aws:s3:::${aws_s3_bucket.hugo_source_bucket.bucket}",
                    "arn:aws:s3:::${aws_s3_bucket.hugo_source_bucket.bucket}/*",
                    "arn:aws:s3:::${aws_s3_bucket.hugo_site_bucket.bucket}",
                    "arn:aws:s3:::${aws_s3_bucket.hugo_site_bucket.bucket}/*"
                ],
                "Effect": "Allow"
            }
        ]
    }
    EOF
}

resource "aws_lambda_function" "build_site_lambda" {
    filename        = "./lambda/build_site_lambda.zip"
    function_name   = "build_site"
    role            = "${aws_iam_role.iam_for_lambda.arn}"
    handler         = "main.lambda_handler"
    timeout         = 30
    memory_size     = 512

    layers = [ 
        "${aws_lambda_layer_version.hugo.arn}", 
        "${aws_lambda_layer_version.libstdc.arn}", 
        "${aws_lambda_layer_version.aws_cli.arn}" 
    ]

    # The filebase64sha256() function is available in Terraform 0.11.12 and later
    # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
    # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
    source_code_hash = "${filebase64sha256("${path.module}/lambda/build_site_lambda.zip")}"

    runtime = "python3.7"

    environment {
        variables = {
            SOURCE_PATH = "${aws_s3_bucket.hugo_source_bucket.bucket}"
            DESTINATION_BUCKET ="${aws_s3_bucket.hugo_site_bucket.bucket}"
        }
    }
}