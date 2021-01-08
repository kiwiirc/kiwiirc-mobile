## Updating the kiwiirc git submodule

`kiwiirc-mobile` includes [`kiwiirc`](https://github.com/kiwiirc/kiwiirc) as a git submodule. To update 
`kiwiirc` to the latest version, follow the steps:

1. Pull the latest `kiwiirc`:
   ```bash
   cd kiwiirc
   git checkout master
   git pull
   ```

2. Commit the `kiwiirc` submodule link:
   ```bash
   # back to kiwiirc-mobile
   cd .. 
   git commit -am "Update kiwiirc"
   git push
   ```
