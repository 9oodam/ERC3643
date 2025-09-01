# ERC-3643 을 활용하여 RWA 토큰 발행해보기

## 🚩 Step 1. 환경 설정

프로젝트 클론

```sh
git clone https://github.com/9oodam/ERC3643.git
cd ERC3643
yarn install
```

첫 번째 터미널에서 로컬 블록체인 초기화

```sh
yarn chain
```

두 번째 터미널에서 프론트엔드 시작

```sh
yarn start
```

세 번째 터미널에서 스마트 계약 배포

```sh
yarn deploy

# 아래 구문을 통해 언제든지 새로운 스마트 계약을 배포할 수 있다.
yarn deploy --reset
```

📱 http://localhost:3000 으로 접속해서 애플리케이션 열기

Burner 지갑 계정 변경

(미션에서 진행할 토큰 발행을 위해 TREXFactory.sol 의 deployer 와 동일한 계정을 사용한다.)

`yarn chain` 후, 터미널에서 다음과 같은 계정 정보를 확인할 수 있다. 로컬에서 배포시 기본적으로 첫 번째 계정이 deployer 가 된다.

브라우저의 Metamask 에서 [계정 가져오기] -> [개인키로 가져오기] 를 선택하여 계정을 import 한다.

```sh
Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

애플리케이션의 우측 상단에 있는 지갑 계정을 방금 추가한 계정으로 변경 후 아래 미션을 진행한다.

### 🔎 실제 네트워크를 사용하는 경우

Hardhat 설정 수정

```typescript
// packages/hardhat/hardhat.config.ts 파일에서 defaultNetwork 를 변경

const defaultNetwork = "creditCoin3Testnet";
```

프론트엔드 네트워크 설정 수정

```typescript
// packages/nextjs/scaffold.config.ts 파일에서 targetNetwork 를 변경

const targetNetwork = chains.creditCoin3Testnet;
```

Burner 지갑 설정 변경

```typescript
// packages/nextjs/scaffold.config.ts 파일에서 onlyLocalBurnerWallet 를 false 로 변경

// ... existing code ...
onlyLocalBurnerWallet: false,
// ... existing code ...
```

배포자 계정 설정

```sh
yarn generate

# 사용하고자 하는 계정의 private key 입력
# 비밀번호 입력
# generate 가 성공하면 .env 파일에 'DEPLOYER_PRIVATE_KEY_ENCRYPTED' 가 추가된 것을 확인할 수 있다.
```

스마트 계약 배포

```sh
yarn deploy
```

---

## 🚩 Step 2. RWA 토큰 발행

> ✏️ 'Deploy' 탭에서 필요한 인자값을 넣고 **Deploy ERC-3643 Token** 버튼을 클릭한다.

필수 인자값

| 구분          | 필드명   | 설명                                                               | 예시                                       |
| ------------- | -------- | ------------------------------------------------------------------ | ------------------------------------------ |
| 기본          | Salt     | Factory에서 토큰 주소를 생성/조회하기 위해 필요한 고유한 string 값 | my-token-salt                              |
| Token Details | Owner    | 모든 컨트랙트의 소유자 주소                                        | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 |
|               | Name     | 토큰의 전체 이름이자, 사용자가 토큰을 식별할 수 있는 명칭          | My Real World Asset Token                  |
|               | Symbol   | 토큰의 심볼(티커)로, 보통 3~5글자의 영문 대문자로 표기             | RWA                                        |
|               | Decimals | 토큰이 소수점 이하로 가질 수 있는 자리수                           | 18                                         |

추후 추가 가능한 인자값들

| 구분          | 필드명              | 설명                                                                                                         | 예시                                                                                                      |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Token Details | IRS                 | IdentityRegistryStorage의 주소로, 토큰의 신원 정보를 저장하는 컨트랙트                                       | 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd                                                                |
|               | ONCHAINID           | 온체인 신원 식별자로, 토큰 소유자 또는 특정 계정의 신원을 블록체인 상에서 식별할 때 사용                     | 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd (yarn deploy 시 함께 배포된 Identity contract 의 address 사용) |
|               | IR Agents           | IdentityRegistry에서 신원 등록 및 관리를 담당하는 에이전트 주소 목록                                         | ["0x1111...1111", "0x2222...2222"]                                                                        |
|               | Token Agents        | 토큰 컨트랙트에서 특정 역할(예: 발행, 소각 등)을 수행할 수 있는 에이전트 주소 목록                           | ["0x3333...3333", "0x4444...4444"]                                                                        |
|               | Compliance Modules  | 토큰의 규제 준수(Compliance)를 위한 모듈 컨트랙트 주소 목록                                                  | ["0x5555...5555"]                                                                                         |
|               | Compliance Settings | 각 컴플라이언스 모듈에 전달할 설정 값(예: 화이트리스트, 한도 등), 각 모듈의 설정 함수 호출을 위한 hex 문자열 | ["0x12345678"]                                                                                            |
| Claim Details | Claim Topics        | 신원 인증에 필요한 클레임 주제(Claim Topic)들의 목록                                                         | [1, 2, 3]                                                                                                 |
|               | Issuers             | 각 Claim Topic에 대해 신원을 인증할 수 있는 발급자(issuer) 주소 목록                                         | ["0x6666...6666", "0x7777...7777"]                                                                        |
|               | Issuer Claims       | 각 issuer가 발급한 클레임의 상세 정보(예: 만료일, claim type 등)                                             | [[1,2],[3]]                                                                                               |

![deploy1](/images/deploy1.png)
![deploy2](/images/deploy2.png)
![deploy3](/images/deploy3.png)

**[RWA Token Deploying Sequence]**

![architecture](/images/architecture.png)

---

## 🚩 Step 3. 발행된 토큰 확인

> ✏️ 'Load' 탭에서 토큰 발행시 사용한 **Salt** 값을 입력한다.

![load1](/images/load1.png)

TREXFactory 컨트랙트의 getToken 을 실행하여 토큰 주소를 반환 받는다.

```solidity
// TREXFactory.sol
function getToken(string calldata _salt) external view returns(address);
```

> ✏️ **Load This Token** 버튼을 클릭한다.

![load2](/images/load2.png)

Token 컨트랙트에서 이름(Name), 심볼(Symbol), Decimals, 잔액(Balance), 소유자(Owner), 에이전트 여부(isAgent) 를 조회하고,

```solidity
// Token.sol 의 isAgent
function isAgent(address _agent) public view returns (bool) {
  return _agents.has(_agent);
}
```

IdentityRegistry 컨트랙트에서는 해당 계정의 인증 여부(isVerified)를 확인한다.

```solidity
// IdentityRegistry.sol 의 isVerified
function isVerified(address _userAddress) external view returns (bool);
```
