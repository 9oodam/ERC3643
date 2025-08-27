// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "./TREXFactory.sol";

contract TREXImplementationAuthority is ITREXImplementationAuthority, Ownable {
    address public tokenImplementation;
    address public ctrImplementation;
    address public irImplementation;
    address public irsImplementation;
    address public tirImplementation;
    address public mcImplementation;

    constructor(
        address _tokenImplementation,
        address _ctrImplementation,
        address _irImplementation,
        address _irsImplementation,
        address _tirImplementation,
        address _mcImplementation
    ) {
        tokenImplementation = _tokenImplementation;
        ctrImplementation = _ctrImplementation;
        irImplementation = _irImplementation;
        irsImplementation = _irsImplementation;
        tirImplementation = _tirImplementation;
        mcImplementation = _mcImplementation;
    }

    function getTokenImplementation() external view override returns (address) {
        return tokenImplementation;
    }

    function getCTRImplementation() external view override returns (address) {
        return ctrImplementation;
    }

    function getIRImplementation() external view override returns (address) {
        return irImplementation;
    }

    function getIRSImplementation() external view override returns (address) {
        return irsImplementation;
    }

    function getTIRImplementation() external view override returns (address) {
        return tirImplementation;
    }

    function getMCImplementation() external view override returns (address) {
        return mcImplementation;
    }

    // 나머지 인터페이스 함수들
    function addTREXVersion(Version calldata, TREXContracts calldata) external override {}
    function addAndUseTREXVersion(Version calldata, TREXContracts calldata) external override {}
    function useTREXVersion(Version calldata) external override {}
    function changeImplementationAuthority(address, address) external override {}
    function getCurrentVersion() external view override returns (Version memory) {
        return Version(1, 0, 0);
    }
    function getContracts(Version calldata) external view override returns (TREXContracts memory) {
        return TREXContracts(
            tokenImplementation,
            ctrImplementation,
            irImplementation,
            irsImplementation,
            tirImplementation,
            mcImplementation
        );
    }
    function getTREXFactory() external view override returns (address) {
        return address(0);
    }

    function fetchVersion(Version calldata) external override {}
    function setTREXFactory(address) external override {}
    function setIAFactory(address) external override {}
    function isReferenceContract() external view override returns (bool) {
        return false;
    }
    function getReferenceContract() external view override returns (address) {
        return address(0);
    }
}