# Tiny throwaway image just to run seed-demo-users.sh with curl + mysql-client
# available. Not part of the app's runtime images.
FROM alpine:3.20
RUN apk add --no-cache bash curl mysql-client
WORKDIR /seed
COPY seed-demo-users.sh .
RUN chmod +x seed-demo-users.sh
ENTRYPOINT ["./seed-demo-users.sh"]
