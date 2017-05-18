# AWS CodePipeline을 위해 S3 오브젝트를 복사하는 Lambda 함수

소스코드가 있는 리존의 S3 버킷(소스)에 만들어진 빌드 산출물을 EC2 인스턴스가 있는 리존의 S3 버킷(타겟)으로 복사한다.
node.js 로 구현하였고 Serverless 프레임워크를 활용하여 AWS에 디플로이하도록 만든 Lambda 함수이다.

### Configuration
- 소스 리존에 CloudFormation, S3, Lambda 서비스에 대한 권한이 있어야 하고, 타겟 리존에 S3에 대한 권한이 필요하다.
- 소스 리존의 S3 버킷은 미리 만들어 두면 안되고, 타겟 리존의 S3 버킷은 미리 만들어놔야 한다.
- 소스 버킷과 타겟 버킷은 serverless.yml 파일 안에 기술할 것이다.
- node.js 와 npm 패키지 매니저가 설치되어 있어야 한다.


### 1. 저장소 Clone
저장소를 clone 한다.


### 2. 패키지 설치
node.js 와 npm 이 설치되어 있는 경우
```
$ npm install
```

node.js와 npm이 설치되어 있지 않은 경우에는 먼저 설치해야 한다. (이들의 설치는 생략)


### 3. serverless.yml 수정
YAML 파일을 수정함에 있어서 하위 항목은 상위 항목보다 2개 이상의 공백을 넣어서 들여쓰기를 해야 한다는 점을 유의해야 한다.

Lambda 함수를 디플로이할 리존 코드를 지정한다. [AWS 리존 코드 확인하기](http://docs.aws.amazon.com/general/latest/gr/rande.html)
```
  region: us-east-1
```  

소스 버킷 이름은 `functions.copy.events.s3.bucket` 에 기술한다. 따옴표나 쌍따옴표 없이 기술한다. `"source-bucket"`, `'source-bucket'`, \`source-bucket\` 이 아니라 `source-bucket` 이라고 쓰면 된다. 버킷의 서비스 디렉토리에 빌드 산출물이 있다면, `rules.prefix` 란에 기재한다.

타겟 버킷 이름은 `functions.copy.environments.TargetBucket` 에 기술한다. 역시 따옴표나 쌍따옴표 없이 기술한다.

```
functions:
  copy:
     handler: handler.copy
     events:
        - s3:
           bucket: write-source-bucket-name-here
           event: s3:ObjectCreated:*
           rules:
                - prefix: subdir
     environment:
        TargetBucket: write-target-bucket-name-here
```        

소스 버킷에 `prefix` 가 없다면, 아래와 같이 하면 오류가 발생한다.
```
           rules:
                - prefix: 
```

다음과 같이 코멘트 처리하거나 `- prefix` 를 삭제해야 한다.
```
           rules:
#                - prefix: 
```


### 4. AWS에 디플로이하기
다음과 같이 Serverless 프레임워크의 명령어를 실행한다.
```
serverless deploy -v
```

몇 분 걸린 후에 정상적으로 완료되면 아래와 같은 내용을 보여준다. 

```
Serverless: Stack update finished...
Service Information
service: copyS3Object
stage: dev
region: us-east-1
api keys:
  None
endpoints:
  None
functions:
  copy: copyS3Object-dev-copy
```


### 5. 테스트

대게 다음과 같이 디플로이한 Lambda 함수를 실행할 수 있으나 적절한 이벤트 데이터가 전달되지 않으면 제대로 테스트할 수 없다.
```
serverless invoke --function copy 
```
따라서, 파일을 소스 버킷에 업로드해본다. 그런 다음, 타겟 버킷에 해당 파일이 생성되는지 확인한다.

CloudWatch의 로그를 통해서도 확인해볼 수 있다.
