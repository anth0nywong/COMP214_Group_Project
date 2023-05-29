FROM node:lts-slim

# Install oracle instant client
RUN apt update
RUN apt-get install -y wget zip
RUN mkdir /opt/oracle
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/214000/instantclient-basic-linux.x64-21.4.0.0.0dbru.zip
RUN unzip /opt/oracle/instantclient*.zip
RUN rm /opt/oracle/instantclient*.zip
RUN apt update
RUN apt install libaio1
RUN sh -c "echo /opt/oracle/instantclient_21_4 > /etc/ld.so.conf.d/oracle-instantclient.conf"
RUN ldconfig

COPY ./Wallet_DB20220722165842.zip /opt/oracle/instantclient_21_4/network/admin
WORKDIR /opt/oracle/instantclient_21_4/network/admin
RUN unzip -o /opt/oracle/instantclient_21_4/network/admin/Wallet_DB20220722165842.zip

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install

WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

EXPOSE 3000

CMD ["yarn", "start"] 