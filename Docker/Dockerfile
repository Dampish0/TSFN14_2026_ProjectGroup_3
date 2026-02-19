FROM alpine:3.22

RUN cd frontend \
    && npm install \
    && npm run build \
    && cd ..backend \
    && npm install \
    && npm run start