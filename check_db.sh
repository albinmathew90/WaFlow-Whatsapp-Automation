#!/bin/bash
psql -U postgres -d convoreach -c "SELECT phone, status FROM session WHERE id = '2ccfb06a-405a-42de-877c-62042bd8045c';"
