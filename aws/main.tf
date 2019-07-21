provider "aws" {
    version = "~> 2.0"
    region  = "eu-central-1"
}

variable "myregion" {}

variable "accountId" {}

resource "aws_lambda_layer_version" "hugo" {
    filename    = "${path.module}/lambda/layers/hugo.zip"
    layer_name  = "hugo"

    source_code_hash = "${filebase64sha256("${path.module}/lambda/layers/hugo.zip")}"

    compatible_runtimes = [ "python3.7" ]
}

resource "aws_lambda_layer_version" "libstdc" {
    filename    = "${path.module}/lambda/layers/libstdc.zip"
    layer_name  = "libstdc"
    
    source_code_hash = "${filebase64sha256("${path.module}/lambda/layers/libstdc.zip")}"

    compatible_runtimes = [ "python3.7" ]
}

resource "aws_lambda_layer_version" "aws_cli" {
    filename    = "${path.module}/lambda/layers/aws_cli.zip"
    layer_name  = "aws_cli"

    source_code_hash = "${filebase64sha256("${path.module}/lambda/layers/aws_cli.zip")}"

    compatible_runtimes = [ "python3.7" ]
}

resource "aws_s3_bucket" "hugo_source_bucket" {
    bucket = "hugo-source-bucket"
    acl = "private"
}

resource "aws_s3_bucket" "hugo_site_bucket" {
    bucket  = "maartens.website"
    acl     = "public-read"
    policy  = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadForGetBucketObjects",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::maartens.website/*"
            ]
        }
    ]
}
EOF
    website {
        index_document = "index.html"
        error_document = "404.html"
    }
}

resource "aws_iam_policy" "iam_policy_for_lambda" {
    name = "policy_for_lambda"
    path ="/"
    description = "policy to give lambda access to s3 buckets"

    policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:PutObject",
                "s3:DeleteObject",
                "sts:AssumeRole"
            ],
            "Resource": [
                "${aws_s3_bucket.hugo_source_bucket.arn}",
                "${aws_s3_bucket.hugo_source_bucket.arn}/*",
                "${aws_s3_bucket.hugo_site_bucket.arn}",
                "${aws_s3_bucket.hugo_site_bucket.arn}/*"
            ],
            "Effect": "Allow"
        }
    ]
}
EOF
}

resource "aws_iam_role" "iam_for_lambda" {
    name = "iam_for_lambda"

    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "iam_policy_for_lambda_attachment" {
    role = "${aws_iam_role.iam_for_lambda.name}"
    policy_arn = "${aws_iam_policy.iam_policy_for_lambda.arn}"
}

resource "aws_api_gateway_rest_api" "lambda_webhook" {
    name        = "build_hugo_site_webhook"
    description = "A webhook to trigger the build for the hugo website."
}

resource "aws_api_gateway_resource" "lambda_webhook_resource" {
    path_part   = "build-hugo-site"
    parent_id   = "${aws_api_gateway_rest_api.lambda_webhook.root_resource_id}"
    rest_api_id = "${aws_api_gateway_rest_api.lambda_webhook.id}"
}

resource "aws_api_gateway_api_key" "lambda_webhook_api_key" {
  name = "lambda_webhook_api_key"
}

resource "aws_api_gateway_method" "lambda_webhook_method" {
    rest_api_id      = "${aws_api_gateway_rest_api.lambda_webhook.id}"
    resource_id      = "${aws_api_gateway_resource.lambda_webhook_resource.id}"
    http_method      = "GET"
    authorization    = "NONE"
    api_key_required = true
}

resource "aws_api_gateway_integration" "lambda_webhook_integration" {
    rest_api_id             = "${aws_api_gateway_rest_api.lambda_webhook.id}"
    resource_id             = "${aws_api_gateway_resource.lambda_webhook_resource.id}"
    http_method             = "${aws_api_gateway_method.lambda_webhook_method.http_method}"
    integration_http_method = "POST"
    type                    = "AWS_PROXY"
    uri                     = "arn:aws:apigateway:${var.myregion}:lambda:path/2015-03-31/functions/${aws_lambda_function.build_site_lambda.arn}/invocations"
}

resource "aws_lambda_permission" "lambda_permission" {
    statement_id  = "AllowExecutionFromAPIGateway"
    action        = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.build_site_lambda.function_name}"
    principal     = "apigateway.amazonaws.com"

    source_arn = "arn:aws:execute-api:${var.myregion}:${var.accountId}:${aws_api_gateway_rest_api.lambda_webhook.id}/*/${aws_api_gateway_method.lambda_webhook_method.http_method}${aws_api_gateway_resource.lambda_webhook_resource.path}"
}

resource "aws_lambda_function" "build_site_lambda" {
    filename        = "${path.module}/lambda/build_site_lambda.zip"
    function_name   = "build_hugo_site"
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

/*
    CloudFront
*/

locals {
  s3_origin_id = "S3MaartensWebsite"
}

resource "aws_cloudfront_origin_access_identity" "origin_access_identity" { 

}

resource "aws_cloudfront_distribution" "hugo_site_bucket_distribution" {
    origin {
        domain_name = "${aws_s3_bucket.hugo_site_bucket.bucket_regional_domain_name}"
        origin_id   = "${local.s3_origin_id}"

        s3_origin_config {
            origin_access_identity = "${aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path}"
        }
    }

    enabled             = true
    is_ipv6_enabled     = true
    default_root_object = "index.html"

    default_cache_behavior {
        allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = "${local.s3_origin_id}"

        forwarded_values {
            query_string = false

            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "redirect-to-https"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }

    
    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        acm_certificate_arn = "arn:aws:acm:us-east-1:230395253819:certificate/9d8f1c92-0c6c-4d2b-a3d8-4bf2ae01f344"
        ssl_support_method  = "sni-only"
    }
}

/*
    Route53
*/
resource "aws_route53_zone" "primary" {
  name = "maartens.website"
}

resource "aws_route53_record" "www" {
  zone_id = "${aws_route53_zone.primary.zone_id}"
  name    = "maartens.website"
  type    = "A"

  alias {
    name                   = "${aws_cloudfront_distribution.hugo_site_bucket_distribution.domain_name}"
    zone_id                = "${aws_cloudfront_distribution.hugo_site_bucket_distribution.hosted_zone_id}"
    evaluate_target_health = true
  }
}