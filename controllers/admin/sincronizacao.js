
exports.init = (req, res) => {
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs()});
};