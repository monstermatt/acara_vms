!/bin/bash

export PATH=$PATH:/usr/local/bin

# loading the aws credentials from .env
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    export AWS_ACCESS_KEY_ID=$(grep S3_ACCESS_KEY_ID "$ENV_FILE" | cut -d '=' -f2 | tr -d '')
    export AWS_SECRET_ACCESS_KEY=$(grep S3_SECRET_ACCESS_KEY "$ENV_FILE" | cut -d '=' -f2 | tr -d '')
    export AWS_DEFAULT_REGION=$(grep AWS_REGION "$ENV_FILE" | cut -d '=' -f2 | tr -d '')
    echo "AWS credentials from .env were loaded successfully"
else
    echo "The .env file was not found at $ENV_FILE"
    exit 1
fi

# checking if the aws cli is already installed on the instance
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found, installing..."

    # installing dependencies
    sudo apt install -y curl unzip

    # installing the aws cli
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install

    # cleaning up the install files
    rm -rf awscliv2.zip aws/

    if ! command -v aws &> /dev/null; then
        echo "The AWS CLI installation failed, please install it manually"
        exit 1
    fi
    echo "The AWS CLI was successfully installed"
else
    echo "The AWS CLI is already installed"
fi

# ensure that the target "model" directory has the correct path in production
MODEL_DIR="/home/ubuntu/hes-pulseup/vms/model"

# skipping model download if it already exists
if [ -f "$MODEL_DIR/model.onnx" ]; then
    echo "The model already exists, no need to download again"
    exit 0
fi

echo "Downloading the model from S3..."

aws s3 cp s3://pulse-model-bucket/model/model.onnx \
    "$MODEL_DIR/model.onnx"

if [ $? -eq 0 ]; then
    echo "The model was downloaded successfully"
else
    echo "The model download failed, please check AWS S3 credentials and the bucket name"
    exit 1
fi