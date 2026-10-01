@echo off
title Apache Kafka Broker (KRaft Mode - Port 9092)
echo ========================================================
echo   Starting Apache Kafka 3.8.0 (KRaft Mode)
echo   Broker listening on: localhost:9092
echo ========================================================
cd /d "%~dp0kafka"
bin\windows\kafka-server-start.bat config\kraft\server.properties
pause
