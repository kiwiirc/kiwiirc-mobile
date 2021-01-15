module.exports = function($logger, $projectData, hookArgs) {
    return new Promise(function(resolve, reject) {
        $injector.resolve('packageManager').getPackageManagerName()
            .then((result) => {
                $logger.printMarkdown(
                    `Your current package manager is \`${result || "npm"}\`.`
                );
                
                if (result !== 'yarn') {
                    $logger.printMarkdown(
                        `Please change to \`yarn\` with the command \`ns package-manager set yarn\`.`
                    );
                    reject('yarn required');
                    return;
                }
                resolve();
            })
    });
};
