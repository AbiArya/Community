describe('Landing anchors', () => {
	it('smooth-scrolls to Features and FAQ sections', () => {
		cy.visit('/');
		cy.contains('Learn more').click();
		cy.location('hash').should('eq', '#features');
		cy.get('#features').should('be.visible');
		cy.contains('FAQ').scrollIntoView().should('be.visible');
	});
});


